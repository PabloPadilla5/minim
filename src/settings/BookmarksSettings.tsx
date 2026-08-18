import { Form } from "react-bootstrap";
import { LabelledSelector } from "../components/LabelledSelector";
import { LabelledSlider } from "../components/Slider";
import {
  useBookmarks,
  useBookmarksDispatch,
} from "../bookmarks/BookmarksContext";
import { isBookmarksApiAvailable } from "../bookmarks/bookmarksApi";
import {
  BookmarksBarAppearance,
  BookmarksBarPosition,
  BookmarksBarStyle,
} from "../bookmarks/types";

export function BookmarksSettings() {
  const { settings, error } = useBookmarks();
  const dispatch = useBookmarksDispatch();
  const apiAvailable = isBookmarksApiAvailable();

  const setSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { [key]: value } as any });
  };

  return (
    <div className="bookmarks-settings">
      <Form.Check
        type="switch"
        id="bookmarks-bar-enabled"
        label="Show Bookmarks Bar"
        checked={settings.enabled}
        onChange={(e) => setSetting("enabled", e.target.checked)}
      />

      {!apiAvailable && (
        <div className="bookmarks-settings__warning">
          The bookmarks API is not available in this context. The bookmarks
          bar will be empty unless this page is loaded as a browser extension.
        </div>
      )}

      {error && (
        <div className="bookmarks-settings__warning">{error}</div>
      )}

      <div style={{ marginTop: 16 }}>
        <LabelledSelector
          label="Appearance"
          value={settings.appearance}
          options={[
            { label: "Icon and text", value: "icon_text" },
            { label: "Text only", value: "text_only" },
            { label: "Icon only", value: "icon_only" },
          ]}
          onChange={(value) =>
            setSetting("appearance", value as BookmarksBarAppearance)
          }
        />

        <LabelledSelector
          label="Position"
          value={settings.position}
          options={[
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ]}
          onChange={(value) =>
            setSetting("position", value as BookmarksBarPosition)
          }
        />

        <LabelledSelector
          label="Background style"
          value={settings.style}
          options={[
            { label: "Glass (frosted)", value: "glass" },
            { label: "Solid", value: "solid" },
            { label: "Card (white)", value: "card" },
            { label: "Outline", value: "outline" },
            { label: "Transparent", value: "transparent" },
          ]}
          onChange={(value) =>
            setSetting("style", value as BookmarksBarStyle)
          }
        />

        {(settings.style === "glass" || settings.style === "outline") && (
          <LabelledSlider
            label={`Blur (${settings.blur}px)`}
            min={0}
            max={30}
            currentValue={settings.blur}
            onChange={(blur: number) => setSetting("blur", blur)}
          />
        )}

        <div className="bookmarks-settings__hint">
          Folders always show their label so you can identify them at a glance.
          Click a folder to open its contents as a list.
        </div>
      </div>
    </div>
  );
}
