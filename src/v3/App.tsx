import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

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

const AnimatedRender = ({
  showing,
  duration,
  children,
}: {
  showing: boolean;
  duration: number;
  children: React.ReactNode;
}) => {
  const [isMounted, setIsMounted] = useState(showing);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted((prev) => {
      if (showing) {
        return true;
      } else if (prev) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => setIsMounted(false), duration);
        return prev;
      }
      return prev;
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showing, duration]);

  return isMounted || showing ? children : null;
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
  const dragState = useRef<{
    isDragging: boolean;
    translateY: number;
    dragStartY: number;
    initialYOffset: number;
    dragDirection: "up" | "down" | null;
    touchStartedOnDrawer: boolean;
  }>({
    isDragging: false,
    translateY: 0,
    dragStartY: 0,
    initialYOffset: 0,
    dragDirection: null,
    touchStartedOnDrawer: false,
  });

  const viewportHeight = useViewportHeight();
  const { height: drawerContentHeight = 0 } = useBoundingClientRect(drawerRef, [
    children,
  ]);
  const opacityAnimationTimeoutRef = useRef<number | null>(null);
  const transformAnimationTimeoutRef = useRef<number | null>(null);

  usePreventBodyScroll(isOpen);
  useKeyPress("Escape", onClose);

  const getOpenTranslateY = useCallback(() => {
    return viewportHeight - drawerContentHeight;
  }, [drawerContentHeight, viewportHeight]);

  const getClosedTranslateY = useCallback(() => {
    return viewportHeight;
  }, [viewportHeight]);

  const animate = useCallback(
    ({
      elementRef,
      key,
      value,
      transition,
      timeoutRef,
      duration,
    }: {
      elementRef: React.RefObject<HTMLElement | null>;
      key: string;
      value: string;
      transition: string;
      timeoutRef: React.RefObject<number | null>;
      duration: number;
    }) => {
      const element = elementRef.current;
      if (!element) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // @ts-expect-error -- key should be a valid CSS property
      element.style[key] = value;
      element.style.transition = transition;
      timeoutRef.current = setTimeout(() => {
        element.style.transition = "none";
      }, duration);
    },
    []
  );

  const animateToPosition = useCallback(
    (translateY: number) => {
      animate({
        elementRef: drawerRef,
        key: "transform",
        value: `translateY(${translateY}px)`,
        transition: "transform 300ms cubic-bezier(.52,.05,0,.99)",
        timeoutRef: transformAnimationTimeoutRef,
        duration: 300,
      });
    },
    [animate]
  );

  const animateOverlay = useCallback(
    (opacity: number) => {
      animate({
        elementRef: overlayRef,
        key: "opacity",
        value: `${opacity}`,
        transition: "opacity 0.3s cubic-bezier(.39,.54,.1,.94)",
        timeoutRef: opacityAnimationTimeoutRef,
        duration: 2000,
      });
    },
    [animate]
  );

  useEffect(() => {
    const drawerElement = drawerRef.current;

    if (!drawerElement) {
      return;
    }

    if (isOpen) {
      dragState.current.translateY = getOpenTranslateY();
      animateToPosition(dragState.current.translateY);
      animateOverlay(1);
    } else {
      dragState.current.translateY = getClosedTranslateY();
      animateToPosition(dragState.current.translateY);
      animateOverlay(0);
    }
  }, [
    animateOverlay,
    animateToPosition,
    drawerContentHeight,
    getClosedTranslateY,
    getOpenTranslateY,
    isOpen,
    viewportHeight,
  ]);

  useEffect(() => {
    const drawerElement = drawerRef.current;

    if (!drawerElement) {
      return;
    }

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
      const event = e instanceof MouseEvent ? e : e.touches[0];

      dragState.current.isDragging = true;
      dragState.current.dragStartY = event.clientY;
      dragState.current.touchStartedOnDrawer = true;

      const { top } = drawerElement.getBoundingClientRect();
      dragState.current.initialYOffset = event.clientY - top;
      document.body.style.userSelect = "none";
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!dragState.current.isDragging) {
        return;
      }
      const event = e instanceof MouseEvent ? e : e.touches[0];
      const diff = event.clientY - dragState.current.dragStartY;

      const newTranslateY =
        dragState.current.dragStartY + diff - dragState.current.initialYOffset;

      const prevTranslateY = dragState.current.translateY;

      if (newTranslateY < prevTranslateY) {
        dragState.current.dragDirection = "up";
      } else if (newTranslateY > prevTranslateY) {
        dragState.current.dragDirection = "down";
      }

      dragState.current.translateY = newTranslateY;

      // Prevent drawer from being dragged too far up
      const amountDrawerShowing =
        window.innerHeight - dragState.current.translateY;
      const drawerHeight = drawerElement.getBoundingClientRect().height;
      if (amountDrawerShowing > drawerHeight) {
        return;
      }

      drawerElement.style.transform = `translateY(${dragState.current.translateY}px)`;
    };

    const handleDragEnd = () => {
      dragState.current.isDragging = false;

      if (dragState.current.dragDirection === "down") {
        onClose();
      } else if (dragState.current.dragDirection === "up") {
        dragState.current.translateY = getOpenTranslateY();
        animateToPosition(dragState.current.translateY);
      }
      document.body.style.userSelect = "";

      requestAnimationFrame(() => {
        dragState.current.touchStartedOnDrawer = false;
      });
    };

    drawerElement.addEventListener("mousedown", handleDragStart);
    drawerElement.addEventListener("touchstart", handleDragStart);
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("touchmove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);
  }, [onClose, getOpenTranslateY, animateToPosition]);

  return (
    <AnimatedRender showing={isOpen} duration={500}>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50"
        onClick={(e) => {
          if (
            !drawerRef.current?.contains(e.target as Node) &&
            !dragState.current.touchStartedOnDrawer
          ) {
            onClose();
          }
        }}
        style={{
          opacity: 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      ></div>
      <div
        ref={drawerRef}
        className="fixed left-0 top-0 right-0 w-full max-h-[calc(100vh-20px)] rounded-t-xl bg-white flex flex-col z-10"
        style={{
          maxHeight: viewportHeight,
          boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
          transition: "none",
          transform: `translateY(${viewportHeight}px)`,
        }}
      >
        <div className="flex justify-between items-center p-4">
          <h3 className="text-neutral-950 text-lg font-bold">{headingText}</h3>
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
    </AnimatedRender>
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
            <div key={index} className="text-sm text-neutral-600">
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
