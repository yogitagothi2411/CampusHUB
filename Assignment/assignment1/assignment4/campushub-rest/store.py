from threading import RLock
from models import Registration

class RegistrationStore:
    def __init__(self):
        self._items = {}
        self._idempotency = {}
        self._next_id = 1
        self._lock = RLock()

    def create(self, event_id, student_reference, key=None):
        with self._lock:
            if key and key in self._idempotency:
                reg_id = self._idempotency[key]
                return self._items[reg_id], False
            reg_id = str(self._next_id)
            self._next_id += 1
            item = Registration(reg_id, event_id, student_reference, "CONFIRMED", key)
            self._items[reg_id] = item
            if key:
                self._idempotency[key] = reg_id
            return item, True

    def get(self, registration_id):
        return self._items.get(registration_id)

    def list(self, event_id=None, status=None):
        items = list(self._items.values())
        if event_id:
            items = [x for x in items if x.event_id == event_id]
        if status:
            items = [x for x in items if x.status == status]
        return items

    def cancel(self, registration_id):
        with self._lock:
            item = self._items.get(registration_id)
            if item is None:
                return None, "missing"
            if item.status == "CANCELLED":
                return item, "conflict"
            item.status = "CANCELLED"
            return item, "ok"

store = RegistrationStore()
