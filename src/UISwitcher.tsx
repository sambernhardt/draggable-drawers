import { type ReactNode, useState } from "react";
import { createPortal } from "react-dom";

type VersionsType<T extends Record<string, unknown>> = {
  [key: string]: (props: T) => ReactNode;
};

type UISwitcherProps<T extends Record<string, unknown>> = {
  versions: VersionsType<T>;
  defaultVersion?: string;
  props: T;
  showSwitcher?: boolean;
};

export const UISwitcher = <T extends Record<string, unknown>>({
  versions,
  defaultVersion,
  props,
  showSwitcher = true,
}: UISwitcherProps<T>) => {
  const versionKeys = Object.keys(versions);
  const [activeVersion, setActiveVersion] = useState<string>(
    defaultVersion || versionKeys[0]
  );

  const Version = versions[activeVersion];

  return (
    <>
      <Version {...props} />
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false &&
        createPortal(
          showSwitcher && (
            <div
              data-switcher
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 1000,
                padding: "8px",
                borderRadius: "4px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <select
                value={activeVersion}
                onChange={(e) => setActiveVersion(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                {versionKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          ),
          document.body
        )}
    </>
  );
};
