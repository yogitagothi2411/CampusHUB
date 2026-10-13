from threading import RLock
from models import Registration

class Store:
    """In-memory demo store; use a database for persistence in production."""
    def __init__(self):
        self.items = {}
        self.next_id = 1
        self.idempotency = {}
        self.lock = RLock()

store = Store()
