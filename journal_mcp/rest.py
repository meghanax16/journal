from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List
import uuid
from datetime import datetime
import os

from pymongo import MongoClient, UpdateOne
import traceback
from dotenv import load_dotenv

load_dotenv()  # load .env if present
app = FastAPI(title="Journal REST API")
@app.get("/health")
def health():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HabitIn(BaseModel):
    id: str
    name: str
    completed: bool
    streak: int
    createdAt: str
    completionsByDate: Dict[str, bool]
    notify: bool | None = None
    notifyTime: str | None = None
    notificationId: str | None = None


# Minimal upsert models with defaults
class HabitUpsert(BaseModel):
    id: str | None = None
    name: str
    completed: bool = False
    streak: int = 0
    createdAt: str | None = None  # ISO; default now
    completionsByDate: Dict[str, bool] = {}
    notify: bool = False
    notifyTime: str | None = None
    notificationId: str | None = None


@app.post("/habits/upsert")
def upsert_habit_minimal(habit: HabitUpsert) -> Dict[str, Any]:
    try:
        collection = get_collection("habits")
        habit_id = habit.id or str(uuid.uuid4())
        # createdAt handling
        if habit.createdAt:
            try:
                created_dt = datetime.fromisoformat(habit.createdAt.replace("Z", "+00:00"))
            except Exception:
                created_dt = datetime.utcnow()
        else:
            created_dt = datetime.utcnow()

        doc = {
            "id": habit_id,
            "name": habit.name,
            "completed": bool(habit.completed),
            "streak": int(habit.streak),
            "createdAt": created_dt,
            "completionsByDate": habit.completionsByDate or {},
            "notify": bool(habit.notify),
            "notifyTime": habit.notifyTime,
            "notificationId": habit.notificationId,
        }
        collection.update_one({"id": habit_id}, {"$set": doc}, upsert=True)
        # Return with ISO createdAt for client
        doc_return = {**doc, "createdAt": created_dt.isoformat().replace("+00:00", "Z")}
        return doc_return
    except HTTPException:
        raise
    except Exception as e:
        print("/habits/upsert error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class JournalEntryUpsert(BaseModel):
    id: str | None = None
    content: str
    title: str | None = None
    mood: str | None = None
    tags: List[str] | None = None
    timestamp: str | None = None  # ISO; default now


@app.post("/journal-entries/upsert")
def upsert_journal_entry_minimal(entry: JournalEntryUpsert) -> Dict[str, Any]:
    try:
        collection = get_collection("journal_entries")
        entry_id = entry.id or str(uuid.uuid4())
        if entry.timestamp:
            try:
                ts = datetime.fromisoformat(entry.timestamp.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.utcnow()
        else:
            ts = datetime.utcnow()

        doc = {
            "id": entry_id,
            "title": entry.title,
            "content": entry.content,
            "mood": entry.mood,
            "tags": entry.tags or [],
            "timestamp": ts,
        }
        collection.update_one({"id": entry_id}, {"$set": doc}, upsert=True)
        return {**doc, "timestamp": ts.isoformat().replace("+00:00", "Z")}
    except HTTPException:
        raise
    except Exception as e:
        print("/journal-entries/upsert error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class HighlightEntryUpsert(BaseModel):
    id: str | None = None
    highlight: str
    reason: str | None = None
    mood: str | None = None
    timestamp: str | None = None  # ISO; default now


@app.post("/highlight-entries/upsert")
def upsert_highlight_entry_minimal(entry: HighlightEntryUpsert) -> Dict[str, Any]:
    try:
        collection = get_collection("highlight_entries")
        entry_id = entry.id or str(uuid.uuid4())
        if entry.timestamp:
            try:
                ts = datetime.fromisoformat(entry.timestamp.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.utcnow()
        else:
            ts = datetime.utcnow()

        doc = {
            "id": entry_id,
            "highlight": entry.highlight,
            "reason": entry.reason,
            "mood": entry.mood,
            "timestamp": ts,
        }
        collection.update_one({"id": entry_id}, {"$set": doc}, upsert=True)
        return {**doc, "timestamp": ts.isoformat().replace("+00:00", "Z")}
    except HTTPException:
        raise
    except Exception as e:
        print("/highlight-entries/upsert error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def get_mongo_collection():
    # Support both MONGODB_URI (preferred) and MONGO_URI (alias)
    mongo_uri = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "journal")
    if not mongo_uri:
        raise HTTPException(status_code=500, detail="MONGODB_URI/MONGO_URI not set")
    client = MongoClient(mongo_uri)
    return client[db_name]["habits"]

def get_collection(collection_name: str):
    mongo_uri = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "journal")
    if not mongo_uri:
        raise HTTPException(status_code=500, detail="MONGODB_URI/MONGO_URI not set")
    client = MongoClient(mongo_uri)
    return client[db_name][collection_name]


@app.post("/habits/bulk")
def upsert_habits(habits: List[HabitIn]):
    try:
        collection = get_collection("habits")
        ops: List[UpdateOne] = []
        for h in habits:
            # Parse createdAt ISO string into datetime for storage
            try:
                created_dt = datetime.fromisoformat(h.createdAt.replace("Z", "+00:00"))
            except Exception:
                created_dt = datetime.utcnow()
            doc = {
                "id": h.id,
                "name": h.name,
                "completed": h.completed,
                "streak": h.streak,
                "createdAt": created_dt,
                "completionsByDate": h.completionsByDate,
                "notify": h.notify,
                "notifyTime": h.notifyTime,
                "notificationId": h.notificationId,
            }
            ops.append(UpdateOne({"id": h.id}, {"$set": doc}, upsert=True))
        if not ops:
            return {"matched": 0, "modified": 0, "upserted": 0}
        result = collection.bulk_write(ops, ordered=False)
        upserted = len(result.upserted_ids) if result.upserted_ids else 0
        return {"matched": result.matched_count, "modified": result.modified_count, "upserted": upserted}
    except HTTPException:
        raise
    except Exception as e:
        print("/habits/bulk error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class HabitCompleteRequest(BaseModel):
    id: str
    date: str | None = None  # 'YYYY-MM-DD' (UTC). If None, uses today.


def _calculate_streak(completions: Dict[str, bool], today_str: str) -> int:
    # Count consecutive days ending at today_str that are True in completions
    try:
        from datetime import datetime, timedelta
        day = datetime.strptime(today_str, "%Y-%m-%d").date()
        streak = 0
        while True:
            key = day.strftime("%Y-%m-%d")
            if completions.get(key):
                streak += 1
                day = day - timedelta(days=1)
            else:
                break
        return streak
    except Exception:
        return 0


@app.post("/habits/complete")
def mark_habit_completed(req: HabitCompleteRequest) -> Dict[str, Any]:
    try:
        collection = get_collection("habits")
        # Determine date key in UTC
        if req.date and len(req.date) == 10:
            date_key = req.date
        else:
            date_key = datetime.utcnow().strftime("%Y-%m-%d")

        doc = collection.find_one({"id": req.id})
        if not doc:
            raise HTTPException(status_code=404, detail="Habit not found")

        completions = doc.get("completionsByDate", {}) or {}
        completions[date_key] = True

        # Recalculate streak ending today
        streak = _calculate_streak(completions, date_key)

        update = {
            "$set": {
                "completed": True,
                "completionsByDate": completions,
                "streak": streak,
            }
        }
        collection.update_one({"id": req.id}, update)

        # Return minimal updated fields
        return {
            "id": req.id,
            "date": date_key,
            "streak": streak,
            "completed": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Journal Entry (Detailed Entries)
class JournalEntryIn(BaseModel):
    id: str
    title: str | None = None
    content: str
    mood: str | None = None
    tags: List[str] | None = None
    timestamp: str  # ISO string from app


@app.post("/journal-entries/bulk")
def upsert_journal_entries(entries: List[JournalEntryIn]):
    try:
        collection = get_collection("journal_entries")
        ops: List[UpdateOne] = []
        for e in entries:
            try:
                ts = datetime.fromisoformat(e.timestamp.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.utcnow()
            doc = {
                "id": e.id,
                "title": e.title,
                "content": e.content,
                "mood": e.mood,
                "tags": e.tags or [],
                "timestamp": ts,
            }
            ops.append(UpdateOne({"id": e.id}, {"$set": doc}, upsert=True))
        if not ops:
            return {"matched": 0, "modified": 0, "upserted": 0}
        result = collection.bulk_write(ops, ordered=False)
        upserted = len(result.upserted_ids) if result.upserted_ids else 0
        return {"matched": result.matched_count, "modified": result.modified_count, "upserted": upserted}
    except HTTPException:
        raise
    except Exception as e:
        print("/journal-entries/bulk error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/journal-entries")
def list_journal_entries() -> List[Dict[str, Any]]:
    try:
        collection = get_collection("journal_entries")
        results: List[Dict[str, Any]] = []
        for doc in collection.find({}, {"_id": 0}):
            ts = doc.get("timestamp")
            if isinstance(ts, datetime):
                ts_iso = ts.isoformat().replace("+00:00", "Z")
            else:
                ts_iso = str(ts) if ts is not None else datetime.utcnow().isoformat() + "Z"
            results.append({
                "id": doc.get("id"),
                "title": doc.get("title"),
                "content": doc.get("content"),
                "mood": doc.get("mood"),
                "tags": doc.get("tags", []),
                "timestamp": ts_iso,
            })
        return results
    except HTTPException:
        raise
    except Exception as e:
        print("GET /journal-entries error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Gratitude Entries
class GratitudeEntryIn(BaseModel):
    id: str
    items: List[str]
    timestamp: str  # ISO string from app


@app.post("/gratitude-entries/bulk")
def upsert_gratitude_entries(entries: List[GratitudeEntryIn]):
    try:
        collection = get_collection("gratitude_entries")
        ops: List[UpdateOne] = []
        for e in entries:
            try:
                ts = datetime.fromisoformat(e.timestamp.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.utcnow()
            doc = {
                "id": e.id,
                "items": e.items,
                "timestamp": ts,
            }
            ops.append(UpdateOne({"id": e.id}, {"$set": doc}, upsert=True))
        if not ops:
            return {"matched": 0, "modified": 0, "upserted": 0}
        result = collection.bulk_write(ops, ordered=False)
        upserted = len(result.upserted_ids) if result.upserted_ids else 0
        return {"matched": result.matched_count, "modified": result.modified_count, "upserted": upserted}
    except HTTPException:
        raise
    except Exception as e:
        print("/gratitude-entries/bulk error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gratitude-entries")
def list_gratitude_entries() -> List[Dict[str, Any]]:
    try:
        collection = get_collection("gratitude_entries")
        results: List[Dict[str, Any]] = []
        for doc in collection.find({}, {"_id": 0}):
            ts = doc.get("timestamp")
            if isinstance(ts, datetime):
                ts_iso = ts.isoformat().replace("+00:00", "Z")
            else:
                ts_iso = str(ts) if ts is not None else datetime.utcnow().isoformat() + "Z"
            results.append({
                "id": doc.get("id"),
                "items": doc.get("items", []),
                "timestamp": ts_iso,
            })
        return results
    except HTTPException:
        raise
    except Exception as e:
        print("GET /gratitude-entries error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Highlight Entries
class HighlightEntryIn(BaseModel):
    id: str
    highlight: str
    reason: str | None = None
    mood: str | None = None
    timestamp: str  # ISO string from app


@app.post("/highlight-entries/bulk")
def upsert_highlight_entries(entries: List[HighlightEntryIn]):
    try:
        collection = get_collection("highlight_entries")
        ops: List[UpdateOne] = []
        for e in entries:
            try:
                ts = datetime.fromisoformat(e.timestamp.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.utcnow()
            doc = {
                "id": e.id,
                "highlight": e.highlight,
                "reason": e.reason,
                "mood": e.mood,
                "timestamp": ts,
            }
            ops.append(UpdateOne({"id": e.id}, {"$set": doc}, upsert=True))
        if not ops:
            return {"matched": 0, "modified": 0, "upserted": 0}
        result = collection.bulk_write(ops, ordered=False)
        upserted = len(result.upserted_ids) if result.upserted_ids else 0
        return {"matched": result.matched_count, "modified": result.modified_count, "upserted": upserted}
    except HTTPException:
        raise
    except Exception as e:
        print("/highlight-entries/bulk error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/highlight-entries")
def list_highlight_entries() -> List[Dict[str, Any]]:
    try:
        collection = get_collection("highlight_entries")
        results: List[Dict[str, Any]] = []
        for doc in collection.find({}, {"_id": 0}):
            ts = doc.get("timestamp")
            if isinstance(ts, datetime):
                ts_iso = ts.isoformat().replace("+00:00", "Z")
            else:
                ts_iso = str(ts) if ts is not None else datetime.utcnow().isoformat() + "Z"
            results.append({
                "id": doc.get("id"),
                "highlight": doc.get("highlight"),
                "reason": doc.get("reason"),
                "mood": doc.get("mood"),
                "timestamp": ts_iso,
            })
        return results
    except HTTPException:
        raise
    except Exception as e:
        print("GET /highlight-entries error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/habits")
def list_habits() -> List[Dict[str, Any]]:
    try:
        collection = get_collection("habits")
        results: List[Dict[str, Any]] = []
        for doc in collection.find({}, {"_id": 0}):
            created_at = doc.get("createdAt")
            if isinstance(created_at, datetime):
                created_iso = created_at.isoformat().replace("+00:00", "Z")
            else:
                created_iso = str(created_at) if created_at is not None else datetime.utcnow().isoformat() + "Z"
            results.append({
                "id": doc.get("id"),
                "name": doc.get("name"),
                "completed": bool(doc.get("completed", False)),
                "streak": int(doc.get("streak", 0)),
                "createdAt": created_iso,
                "completionsByDate": doc.get("completionsByDate", {}),
                "notify": doc.get("notify"),
                "notifyTime": doc.get("notifyTime"),
                "notificationId": doc.get("notificationId"),
            })
        return results
    except HTTPException:
        raise
    except Exception as e:
        print("GET /habits error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn journal_mcp.rest:app --host 0.0.0.0 --port 8100


