from fastapi.testclient import TestClient
import app as m
from store import store
client=TestClient(m.app)
class FakeResponse:
    def __init__(self, status_code=200): self.status_code=status_code
    def raise_for_status(self):
        if self.status_code>=400:
            import requests; raise requests.HTTPError(f'HTTP {self.status_code}')
def setup_function():
    with store.lock:
        store.items.clear(); store.idempotency.clear(); store.next_id=1
    m.rate_counts.clear()
def fake_ok(monkeypatch): monkeypatch.setattr(m.requests,'get',lambda *a,**k:FakeResponse(200))
def create(monkeypatch,key='key-1',event='1',student='STU-1'):
    fake_ok(monkeypatch)
    return client.post('/registrations',headers={'Idempotency-Key':key},json={'eventId':event,'studentReference':student})
def test_create_201_location_and_replay(monkeypatch):
    a=create(monkeypatch); b=create(monkeypatch)
    assert a.status_code==201 and a.headers['location']=='/registrations/1'
    assert b.status_code==201 and b.headers['idempotency-replayed']=='true' and b.json()==a.json()
    assert len(store.items)==1
def test_same_key_different_body_conflicts(monkeypatch):
    create(monkeypatch); r=create(monkeypatch,student='STU-2')
    assert r.status_code==409
def test_list_query_params(monkeypatch):
    create(monkeypatch,event='1'); create(monkeypatch,key='key-2',event='2',student='STU-2')
    r=client.get('/registrations?eventId=2&sort=eventId&order=desc&page=1&limit=5')
    assert r.status_code==200 and r.json()['count']==1 and r.json()['items'][0]['eventId']=='2'
def test_etag_conditional_get_304(monkeypatch):
    create(monkeypatch); a=client.get('/registrations/1'); b=client.get('/registrations/1',headers={'If-None-Match':a.headers['etag']})
    assert a.status_code==200 and b.status_code==304 and not b.content
def test_if_match_stale_returns_412(monkeypatch):
    create(monkeypatch); r=client.put('/registrations/1',headers={'Authorization':'Bearer campushub-demo-token','If-Match':'"stale"'},json={'studentReference':'STU-NEW'})
    assert r.status_code==412
def test_update_requires_auth_and_current_etag(monkeypatch):
    create(monkeypatch); tag=client.get('/registrations/1').headers['etag']
    assert client.put('/registrations/1',headers={'If-Match':tag},json={'studentReference':'STU-X'}).status_code==401
    r=client.put('/registrations/1',headers={'Authorization':'Bearer campushub-demo-token','If-Match':tag},json={'studentReference':'STU-X'})
    assert r.status_code==200 and r.headers['etag'] != tag
def test_400_missing_idempotency_key(monkeypatch):
    fake_ok(monkeypatch); r=client.post('/registrations',json={'eventId':'1','studentReference':'STU-1'})
    assert r.status_code==400
def test_404_missing_registration(): assert client.get('/registrations/999').status_code==404
def test_401_missing_token(monkeypatch):
    create(monkeypatch); tag=client.get('/registrations/1').headers['etag']
    assert client.put('/registrations/1',headers={'If-Match':tag},json={'studentReference':'STU-X'}).status_code==401
def test_options_allow():
    r=client.options('/registrations'); assert r.status_code==204 and 'POST' in r.headers['allow']
def test_headers_and_406(monkeypatch):
    create(monkeypatch); r=client.get('/registrations/1')
    assert r.headers['cache-control'] and r.headers['etag'] and r.headers['x-content-type-options']=='nosniff'
    xml=client.get('/registrations',headers={'Accept':'application/xml'})
    assert xml.status_code==200 and xml.headers['content-type'].startswith('application/xml') and b'<response>' in xml.content
    assert client.get('/registrations',headers={'Accept':'image/png'}).status_code==406
def test_unknown_event_422(monkeypatch):
    monkeypatch.setattr(m.requests,'get',lambda *a,**k:FakeResponse(404))
    r=client.post('/registrations',headers={'Idempotency-Key':'missing'},json={'eventId':'404','studentReference':'STU-1'})
    assert r.status_code==422

def test_malformed_json_returns_400(monkeypatch):
    fake_ok(monkeypatch)
    r=client.post("/registrations",headers={"Idempotency-Key":"bad-json"},content="{bad-json")
    assert r.status_code==400


def test_problem_details_and_two_field_validation():
    r=client.post('/registrations',headers={'Idempotency-Key':'bad-fields'},json={'eventId':'','studentReference':''})
    assert r.status_code==422
    assert r.headers['content-type'].startswith('application/problem+json')
    body=r.json(); assert body['status']==422 and len(body['errors'])>=2

def test_unknown_registration_problem_shape():
    r=client.get('/registrations/9999')
    assert r.status_code==404 and r.json()['type'].endswith('/registration-not-found')

def test_503_retry_after(monkeypatch):
    def fail(*a, **k):
        import requests; raise requests.Timeout('private internal timeout text')
    monkeypatch.setattr(m.requests,'get',fail)
    r=client.post('/registrations',headers={'Idempotency-Key':'timeout'},json={'eventId':'1','studentReference':'STU-1'})
    assert r.status_code==503 and r.headers['retry-after']=='2'
    assert 'private internal timeout text' not in r.text and r.json()['status']==503
