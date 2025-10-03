// Route types are defined below instead of importing from './+types/home'
import { createClient } from "../utils/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request);
  const supabase = (client as any).supabase ?? client;
  const { data: todos } = await supabase.from("todos").select();

  return { todos };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <ul>
        {loaderData.todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </>
  );
}

export namespace Route {
  export interface LoaderArgs {
    request: Request;
  }

  export interface ComponentProps {
    loaderData: {
      todos: Array<{
        id: string | number;
        name: string;
        [key: string]: any;
      }>;
    };
  }
}

