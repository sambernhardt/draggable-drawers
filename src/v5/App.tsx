import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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

const DrawerHandle = ({ direction }: { direction?: "up" | "down" | null }) => {
  const width = 48;
  const height = 16;
  const strokeWidth = 3;

  return (
    <div className="w-full flex items-center justify-center p-4">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path
          d={`M${strokeWidth / 2},${height / 2} L${width / 2},${
            direction === "up"
              ? strokeWidth
              : direction === "down"
              ? height - strokeWidth
              : height / 2
          } L${width - strokeWidth / 2},${height / 2}`}
          stroke="rgb(229 229 229)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

const DrawerHeader = ({ headingText }: { headingText: string }) => {
  return (
    <div className="flex justify-between items-center p-4">
      <h3 className="text-neutral-950 text-lg font-semibold">{headingText}</h3>
      <button
        slot="close"
        className="text-neutral-500 hover:text-neutral-950 w-10 h-10 flex items-center justify-center hover:bg-neutral-950/5 rounded-full -m-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>
    </div>
  );
};

const DURATION = 400;
const FULL_HEIGHT_OFFSET = 20;
const BACKGROUND_INSET = 8;

const Drawer = ({
  isOpen,
  onClose,
  header,
  peekHeight,
  fullHeight = "auto",
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  peekHeight?: number;
  fullHeight?: "auto" | "100%";
  children: React.ReactNode;
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    openState: "peek" | "full" | "closed";
    isDragging: boolean;
    translateY: number;
    dragStartY: number;
    initialYOffset: number;
    dragDirection: "up" | "down" | null;
    touchStartedOnDrawer: boolean;
  }>({
    openState: "closed",
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
  const backgroundAnimationTimeoutRef = useRef<number | null>(null);

  usePreventBodyScroll(isOpen);
  useKeyPress("Escape", onClose);

  const getPeekOpenTranslateY = useCallback(() => {
    return viewportHeight - (peekHeight || 0);
  }, [peekHeight, viewportHeight]);

  const getFullOpenTranslateY = useCallback(() => {
    if (fullHeight === "100%") {
      return FULL_HEIGHT_OFFSET;
    } else {
      return viewportHeight - drawerContentHeight;
    }
  }, [fullHeight, drawerContentHeight, viewportHeight]);

  const getClosedTranslateY = useCallback(() => {
    return viewportHeight;
  }, [viewportHeight]);

  const getBackgroundOutScale = useCallback(() => {
    const root = document.getElementById("root");

    if (!root) {
      return 1;
    }

    const { width } = root.getBoundingClientRect();
    return (width - BACKGROUND_INSET - BACKGROUND_INSET) / width;
  }, []);

  const animate = useCallback(
    ({
      element,
      styles,
      transition,
      timeoutRef,
      duration,
    }: {
      element: HTMLElement | null;
      styles: Record<string, string>;
      transition: string;
      timeoutRef: React.RefObject<number | null>;
      duration: number;
    }) => {
      if (!element) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      Object.entries(styles).forEach(([key, value]) => {
        // @ts-expect-error -- key should be a valid CSS property
        element.style[key] = value;
      });
      element.style.transition = transition;
      timeoutRef.current = setTimeout(() => {
        element.style.transition = "none";
      }, duration);
    },
    []
  );

  const animateToPosition = useCallback(
    (translateY: number, duration?: number) => {
      animate({
        element: drawerRef.current,
        styles: {
          transform: `translateY(${translateY}px)`,
        },
        transition: `transform ${
          duration || DURATION
        }ms cubic-bezier(.52,.05,0,.99)`,
        timeoutRef: transformAnimationTimeoutRef,
        duration: duration || DURATION,
      });
    },
    [animate]
  );

  const animateOverlay = useCallback(
    (opacity: number, duration?: number) => {
      animate({
        element: overlayRef.current,
        styles: {
          opacity: `${opacity}`,
        },
        transition: `opacity ${
          duration || DURATION
        }ms cubic-bezier(.39,.54,.1,.94)`,
        timeoutRef: opacityAnimationTimeoutRef,
        duration: duration || DURATION,
      });
    },
    [animate]
  );

  const animateBackground = useCallback(
    (direction: "in" | "out", duration?: number) => {
      const root = document.getElementById("root");
      const scale = direction === "out" ? 1 : getBackgroundOutScale();
      const translateY = direction === "out" ? 0 : BACKGROUND_INSET;

      animate({
        element: root,
        styles: {
          transform: `scale(${scale}) translateY(${translateY}px)`,
          borderRadius: `${direction === "out" ? "0" : "10px"}`,
        },
        transition: `transform ${
          duration || DURATION
        }ms cubic-bezier(.52,.05,0,.99), border-radius ${
          duration || DURATION
        }ms cubic-bezier(.52,.05,0,.99)`,
        timeoutRef: backgroundAnimationTimeoutRef,
        duration: duration || DURATION,
      });
    },
    [animate, getBackgroundOutScale]
  );

  useEffect(() => {
    const drawerElement = drawerRef.current;

    if (!drawerElement) {
      return;
    }

    if (isOpen && peekHeight) {
      dragState.current.translateY = getPeekOpenTranslateY();
      animateToPosition(dragState.current.translateY);
      animateOverlay(1);
      animateBackground("in");
    } else if (isOpen) {
      dragState.current.translateY = getFullOpenTranslateY();
      animateToPosition(dragState.current.translateY);
      animateOverlay(1);
      animateBackground("in");
    } else {
      dragState.current.translateY = getClosedTranslateY();
      animateToPosition(dragState.current.translateY);
      animateOverlay(0);
      animateBackground("out");
    }
  }, [
    animateBackground,
    animateOverlay,
    animateToPosition,
    drawerContentHeight,
    getBackgroundOutScale,
    getClosedTranslateY,
    getFullOpenTranslateY,
    getPeekOpenTranslateY,
    isOpen,
    peekHeight,
    viewportHeight,
  ]);

  // Drag handler
  useEffect(() => {
    const drawerElement = drawerRef.current;

    if (!drawerElement) {
      return;
    }

    const handleClick = (e: MouseEvent | TouchEvent) => {
      // Find closest button with role="close" to the clicked element
      const target = e.target as HTMLElement;
      const closeButton = target.closest('button[slot="close"]');

      if (closeButton) {
        onClose();
      }
    };

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

      dragState.current.translateY = newTranslateY;

      // Prevent drawer from being dragged too far up
      const amountDrawerShowing =
        window.innerHeight - dragState.current.translateY;
      const drawerHeight = drawerElement.getBoundingClientRect().height;

      if (amountDrawerShowing >= drawerHeight) {
        return;
      }

      drawerElement.style.transform = `translateY(${dragState.current.translateY}px)`;

      if (Math.abs(diff) < 15) {
        return;
      }

      if (newTranslateY < prevTranslateY) {
        dragState.current.dragDirection = "up";
      } else if (newTranslateY > prevTranslateY) {
        dragState.current.dragDirection = "down";
      }

      // Interpolate background scale based on distance to bottom
      if (overlayRef.current) {
        const bottomThreshold = peekHeight
          ? viewportHeight - peekHeight
          : viewportHeight - drawerHeight;
        const progress =
          (newTranslateY - bottomThreshold) /
          (viewportHeight - bottomThreshold);
        const opacity = Math.max(0, 1 - progress);
        overlayRef.current.style.opacity = `${opacity}`;
      }
    };

    const handleDragEnd = () => {
      dragState.current.isDragging = false;

      if (
        dragState.current.dragDirection === "down" &&
        peekHeight &&
        dragState.current.translateY < getPeekOpenTranslateY()
      ) {
        dragState.current.translateY = getPeekOpenTranslateY();
        animateToPosition(dragState.current.translateY);
      } else if (dragState.current.dragDirection === "down") {
        onClose();
      } else if (dragState.current.dragDirection === "up" && peekHeight) {
        dragState.current.translateY = getFullOpenTranslateY();
        animateToPosition(dragState.current.translateY);
      } else if (dragState.current.dragDirection === "up") {
        dragState.current.translateY = getFullOpenTranslateY();
        animateToPosition(dragState.current.translateY);
      } else {
        // If no drag direction, snap to closest position
        const currentPosition = dragState.current.translateY;
        const peekPosition = peekHeight ? getPeekOpenTranslateY() : null;
        const fullPosition = getFullOpenTranslateY();

        if (peekPosition) {
          // Has peek height - compare distances to both positions
          const distanceToPeek = Math.abs(currentPosition - peekPosition);
          const distanceToFull = Math.abs(currentPosition - fullPosition);

          if (distanceToPeek < distanceToFull) {
            dragState.current.translateY = peekPosition;
          } else {
            dragState.current.translateY = fullPosition;
          }
        } else {
          // No peek height - snap to full
          dragState.current.translateY = fullPosition;
        }

        animateToPosition(dragState.current.translateY);
      }
      document.body.style.userSelect = "";

      requestAnimationFrame(() => {
        dragState.current.touchStartedOnDrawer = false;
      });
    };

    drawerElement.addEventListener("click", handleClick);
    drawerElement.addEventListener("mousedown", handleDragStart);
    drawerElement.addEventListener("touchstart", handleDragStart);
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("touchmove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      drawerElement.removeEventListener("mousedown", handleDragStart);
      drawerElement.removeEventListener("touchstart", handleDragStart);
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [
    onClose,
    getFullOpenTranslateY,
    animateToPosition,
    peekHeight,
    getPeekOpenTranslateY,
    viewportHeight,
  ]);

  return createPortal(
    <AnimatedRender showing={isOpen} duration={DURATION + 100}>
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
          height:
            fullHeight === "100%"
              ? `calc(100% - ${FULL_HEIGHT_OFFSET}px)`
              : "auto",
          boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
          transition: "none",
          transform: `translateY(${viewportHeight}px)`,
        }}
      >
        {header}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </AnimatedRender>,
    document.body
  );
};

function App() {
  const [isDrawer1Open, setIsDrawer1Open] = useState(false);
  const [isDrawer2Open, setIsDrawer2Open] = useState(false);
  const [isDrawer3Open, setIsDrawer3Open] = useState(false);
  const [contentIterations, setContentIterations] = useState(1);

  return (
    <div className="max-w-screen w-[500px] h-screen flex flex-col gap-4 justify-center mx-auto p-8">
      <h2 className="text-2xl font-semibold text-center tracking-tight mb-4">
        Draggable drawers
      </h2>
      <button
        onClick={() => setIsDrawer1Open(true)}
        className="border border-neutral-200 text-neutral-900 p-2 rounded-lg w-full font-medium hover:bg-neutral-950/5"
      >
        Open basic drawer
      </button>
      <Drawer isOpen={isDrawer1Open} onClose={() => setIsDrawer1Open(false)}>
        <DrawerHeader headingText="Auto height" />
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="text-sm text-neutral-600">
            This is all the content I have. I don't go any bigger than this so
            you can drag me up. Try dragging me up and down to see how I respond
            to your touch. When you're done exploring, you can either drag me
            down or tap the overlay to close me.
          </div>
        </div>
      </Drawer>
      <button
        onClick={() => setIsDrawer2Open(true)}
        className="border border-neutral-200 text-neutral-900 p-2 rounded-lg w-full font-medium hover:bg-neutral-950/5"
      >
        Open peek drawer
      </button>
      <Drawer
        isOpen={isDrawer2Open}
        onClose={() => setIsDrawer2Open(false)}
        peekHeight={160}
        fullHeight="100%"
      >
        <div className="mb-2" style={{ height: "160px" }}>
          <DrawerHandle />
          <div className="flex flex-col gap-2 px-4 pb-4">
            <h3 className="text-lg font-semibold">Expandable content</h3>
            <div className="text-sm text-neutral-600">
              I'm a peek drawer. I start off with a peek height of 150px and you
              can drag me up and down to see how I respond to your touch.
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="text-sm text-neutral-600">
            More content! When you drag me up, you can see how I expand to
            reveal more content. When you're done exploring, you can either drag
            me down to the peek height or tap the overlay to close me.
            <br />
            <br />
            I also have a handle at the top that you can use to drag me up and
            down. The handle provides a nice visual affordance and makes it
            clear that I'm draggable. When you drag me past certain thresholds,
            I'll snap to either the peek height or full height position.
            <br />
            <br />
            And notice how the background scales and shifts when I open and
            close? These small details help create a more polished and engaging
            interaction.
          </div>
        </div>
      </Drawer>
      <button
        onClick={() => setIsDrawer3Open(true)}
        className="border border-neutral-200 text-neutral-900 p-2 rounded-lg w-full font-medium hover:bg-neutral-950/5"
      >
        Open dynamic height drawer
      </button>
      <Drawer
        isOpen={isDrawer3Open}
        onClose={() => setIsDrawer3Open(false)}
        fullHeight="auto"
      >
        <DrawerHeader headingText="Dynamic height" />
        <div className="flex items-center gap-2 px-4 pb-4">
          <button
            className="border border-neutral-200 text-neutral-900 p-2 rounded-lg w-full font-medium hover:bg-neutral-950/5"
            onClick={() =>
              setContentIterations(Math.max(1, contentIterations - 1))
            }
          >
            -
          </button>
          <div className="text-neutral-900 font-medium w-full text-center">
            {contentIterations}
          </div>
          <button
            className="border border-neutral-200 text-neutral-900 p-2 rounded-lg w-full font-medium hover:bg-neutral-950/5"
            onClick={() =>
              setContentIterations(Math.min(10, contentIterations + 1))
            }
          >
            +
          </button>
        </div>
        <div className="flex flex-col gap-4 px-4 pb-4">
          {Array.from({ length: contentIterations }).map((_, index) => (
            <div key={index} className="text-sm text-neutral-600">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Delectus
              necessitatibus nemo perspiciatis odio voluptate ad tenetur ab quae
              veniam labore, doloribus dolores veritatis unde accusamus!
              Recusandae nesciunt impedit soluta autem?
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
export default App;
