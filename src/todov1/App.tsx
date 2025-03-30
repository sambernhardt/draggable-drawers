import { useState } from "react";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const todos: Todo[] = [
  {
    id: 1,
    title: "Complete project documentation",
    completed: false,
  },
  { id: 2, title: "Review pull requests", completed: true },
  { id: 3, title: "Fix navigation bug", completed: false },
  { id: 4, title: "Update dependencies", completed: true },
  { id: 5, title: "Write unit tests", completed: false },
  {
    id: 6,
    title: "Optimize database queries",
    completed: false,
  },
  { id: 7, title: "Implement user feedback", completed: true },
  { id: 8, title: "Deploy to staging", completed: false },
  { id: 9, title: "Conduct code review", completed: true },
  { id: 10, title: "Update README file", completed: false },
];

const TodoList = ({ todos }: { todos: Todo[] }) => {
  return (
    <div className="flex flex-col">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex justify-between items-center gap-3 p-3 border-b border-neutral-800 hover:bg-neutral-900 cursor-pointer last:border-b-0"
          // onClick={() => setSelectedTodo(todo)}
        >
          <div className="flex items-center justify-center w-6 h-6 border-2 border-neutral-400 rounded-full">
            {todo.completed && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <span className="text-sm text-neutral-200">{todo.title}</span>
          <div className="flex items-center gap-2 ml-auto">
            <button className="ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Drawer = ({
  isOpen,
  onClose,
  headingText,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  headingText: string;
  children: React.ReactNode;
}) => {
  return (
    isOpen && (
      <div>
        <div>
          <h3>{headingText}</h3>
          <button onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            ></svg>
          </button>
        </div>
        {children}
      </div>
    )
  );
};

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="max-w-screen w-[500px] mx-auto my-8">
      <h2 className="text-2xl font-medium tracking-tight mb-4">Todos</h2>
      <TodoList todos={todos} />
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        headingText="Create Todo"
      >
        Todo form here
      </Drawer>
    </div>
  );
}
export default App;
