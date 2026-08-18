import { useRef } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Draggable from "react-draggable";

import { WidgetPicker } from "./settings/WidgetPicker";
import { WallpaperPicker } from "./settings/WallpaperPicker";
import { Button } from "react-bootstrap";
import { About } from "./settings/About";
import { BookmarksSettings } from "./settings/BookmarksSettings";

export const Settings = ({ setDroppingWidgetData, setSettingsOpen }) => {
  const draggableNodeRef = useRef<HTMLDivElement>(null);
  return (
    <Draggable handle=".settings-header" nodeRef={draggableNodeRef}>
      <div ref={draggableNodeRef} className="settings">
        <div className="settings-header">
          <h4>Settings</h4>
          <Button
            className="settings-close-btn"
            variant="secondary"
            onClick={() => {
              setSettingsOpen(false);
            }}
          >
            ✕
          </Button>
        </div>
        <hr className="divider" />
        <div className="settings-content ">
          <Tabs defaultActiveKey="background" className="mb-3">
            <Tab eventKey="background" title="Background">
              <WallpaperPicker />
            </Tab>
            <Tab eventKey="widgets" title="Widgets">
              <WidgetPicker setDroppingWidgetData={setDroppingWidgetData} />
            </Tab>
            <Tab eventKey="bookmarks" title="Bookmarks">
              <BookmarksSettings />
            </Tab>
            <Tab eventKey="about" title="About">
              <About/>
            </Tab>
          </Tabs>
        </div>
      </div>
    </Draggable>
  );
};
