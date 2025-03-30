import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewportHeight;
};

const useKeyPress = (key: string, callback: () => void) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === key) {
        console.log("useKeyPress", e.key, key, callback);
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [key, callback]);
};

const useBoundingClientRect = (
  ref: React.RefObject<HTMLElement | null>,
  deps: unknown[]
) => {
  const [boundingClientRect, setBoundingClientRect] = useState<
    Partial<DOMRect>
  >({
    height: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (ref.current) {
      setBoundingClientRect(ref.current.getBoundingClientRect());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);

  return boundingClientRect;
};

const usePreventBodyScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const viewportHeight = useViewportHeight();
  const { height: drawerContentHeight = 0 } = useBoundingClientRect(drawerRef, [
    children,
  ]);

  usePreventBodyScroll(isOpen);
  useKeyPress("Escape", onClose);

  const translateY = useMemo(() => {
    return isOpen
      ? `translateY(${viewportHeight - drawerContentHeight}px)`
      : `translateY(${viewportHeight}px)`;
  }, [viewportHeight, drawerContentHeight, isOpen]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 z-40"
      onClick={(e) => {
        if (!drawerRef.current?.contains(e.target as Node)) {
          onClose();
        }
      }}
      style={{
        opacity: isOpen ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      <div
        ref={drawerRef}
        className="fixed left-0 top-0 right-0 w-full max-h-[calc(100vh-20px)] rounded-t-xl bg-neutral-900 flex flex-col"
        style={{
          maxHeight: viewportHeight,
          transform: translateY,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <div className="flex justify-between items-center p-4">
          <h3 className="text-white text-lg font-bold">{headingText}</h3>
          <button onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="max-w-screen w-[500px] h-screen flex flex-col justify-center mx-auto p-8">
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="bg-blue-500 text-white p-2 rounded-md w-full"
      >
        Open drawer
      </button>
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        headingText="Heading"
      >
        <div className="flex flex-col gap-4 px-4 pb-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="text-sm text-neutral-400">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis
              dolorem incidunt nulla, et itaque provident beatae. Quos adipisci
              quis aspernatur reprehenderit tempora ipsum sapiente qui, aliquid
              et, libero dicta dolore.
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
export default App;
