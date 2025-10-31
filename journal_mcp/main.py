# import asyncio
# import datetime
# import os
# from typing import Optional
# from fastmcp import FastMCP
# from pydantic import BaseModel
# from pydantic import Field
# from motor.motor_asyncio import AsyncIOMotorClient

# habit_mcp = FastMCP("Journal MCP")

# MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
# DB_NAME = "habittracker"
# HABITS_NAME = "habits"
# JOURNAL_NAME = "journal"
# GRATITUDE_NAME= "gratitude"

# client = AsyncIOMotorClient(MONGO_URI)
# db = client[DB_NAME]
# collection = db[HABITS_NAME]

# class Habits(BaseModel):
#     name: str = Field(description="Name of the habit")
#     completed: bool
#     streak: int
#     createdAt: int
#     completionsByDate: Optional[dict[str,bool]] = Field(default=None)
#     notify: Optional[bool] = Field(default=False)
#     notifyTime: Optional[int] = Field(default=0)
#     notificationId: Optional[str] = Field(default=None)


# @habit_mcp.tool()
# async def add_habit(name: str, notify: bool = False, notify_time: int = 0):
#     """Add a new habit"""
#     new_habit = Habits(
#         name= name,
#         completed= False,
#         streak= 0,
#         createdAt= int(datetime.datetime.now().timestamp()),
#         notify = notify,
#         notifyTime = notify_time
#     )

#     result = await collection.insert_one(new_habit.model_dump())
#     return {"status": str(result.acknowledged)}

# @habit_mcp.tool()
# async def mark_habit_completed_for_today(name: str):
#     """Mark a habit as completed for today and update the streak."""
#     today = datetime.date.today().isoformat()

#     habit = await collection.find_one({"name": name})
#     if not habit:
#         return {"error": "Habit not found"}

#     completions = habit.get("completionsByDate", {})
#     if today in completions:
#         return {"message": "Habit already marked completed for today"}

#     completions[today] = True
#     streak = habit.get("streak", 0) + 1

#     await collection.update_one(
#         {"name": name},
#         {"$set": {"completed": True, "streak": streak, "completionsByDate": completions}}
#     )
#     return {"message": f"Habit '{name}' marked as completed", "streak": streak}



# if _name_ == "_main_":
#     habit_mcp.run(transport="streamable-http")



from fastmcp import FastMCP
from rest import app

# Create an MCP server from your FastAPI app
mcp = FastMCP.from_fastapi(app=app)

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
