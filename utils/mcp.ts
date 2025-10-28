import { Habit, loadHabits, saveHabits } from './storage';

export type McpCallTool = (tool: string, args?: any) => Promise<any>;

// Default MCP server URL. If running on a physical device, replace localhost with your Mac's LAN IP.
export const DEFAULT_MCP_URL = 'http://localhost:8000/mcp';
export const DEFAULT_REST_URL = 'http://localhost:8100';

// Helper to normalize and persist a habit returned by the MCP tool.
export async function addHabitViaMcp(callTool: McpCallTool, name: string): Promise<void> {
  const newHabitData = await callTool('add_habits', { name });

  const newHabit: Habit = {
    id: newHabitData?.id ?? (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: newHabitData?.name ?? name,
    completed: false,
    streak: 0,
    createdAt: new Date(),
    completionsByDate: {},
    notify: Boolean(newHabitData?.notify),
    notifyTime: newHabitData?.notifyTime,
    notificationId: newHabitData?.notificationId,
    accountabilityPartner: newHabitData?.accountabilityPartner,
  };

  const existing = await loadHabits();
  await saveHabits([newHabit, ...existing]);
}

// Optional: lightweight hook re-export so screens can connect to MCP easily.
// Usage:
//   const { state, callTool, error } = useMcpClient();
//   await addHabitViaMcp(callTool, name);
export function useMcpClient(url: string = DEFAULT_MCP_URL) {
  // Lazily require to avoid issues in non-RN environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useMcp } = require('use-mcp/react');
  return useMcp({ url });
}

export async function addHabitViaRest(name: string, baseUrl: string = DEFAULT_REST_URL) {
  const res = await fetch(`${baseUrl}/add-habit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`REST error ${res.status}`);
  const data = await res.json();
  const habit: Habit = {
    id: data?.id ?? (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: data?.name ?? name,
    completed: false,
    streak: 0,
    createdAt: new Date(),
    completionsByDate: {},
    notify: Boolean(data?.notify),
    notifyTime: data?.notifyTime,
    notificationId: data?.notificationId,
    accountabilityPartner: data?.accountabilityPartner,
  };
  return habit;
}

export async function persistHabit(habit: Habit) {
  const existing = await loadHabits();
  await saveHabits([habit, ...existing]);
}









type McpResponse = {
  result?: any;
  error?: string;
};

export async function callMcpTool(
  tool: string,
  args: Record<string, any> = {},
  baseUrl: string = DEFAULT_MCP_URL
): Promise<any> {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tool_call',
        tool,
        args,
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP server error ${response.status}`);
    }

    const data: McpResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.result ?? data;
  } catch (error: any) {
    console.error('❌ MCP call failed:', error);
    throw new Error(error.message || 'Unknown MCP error');
  }
}


