from fastmcp import FastMCP
import asyncio

mcp = FastMCP("Journal MCP")

@mcp.tool
async def add_habits(name: str):
    """Add a new habit to the journal."""
    # Return a habit-like object; your app will persist it
    return {
        "id": name,  # or a UUID generated client-side
        "name": name,
        "completed": False,
        "streak": 0,
        "createdAt": asyncio.get_event_loop().time(),  # you can also return ISO, app will normalize
        "completionsByDate": {},
        "notify": False #You can set this too
    }


@mcp.tool
async def add(a: int, b: int) -> int:
    """Add a and b and return the result."""
    return a + b

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
