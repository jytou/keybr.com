import {
  type ClientMessage,
  GameState,
  handleInput,
  makeWorldState,
  PLAYER_ANNOUNCE_ID,
  PLAYER_PROGRESS_ID,
  type ServerMessage,
  updateWorldState,
  type WorldState,
} from "@keybr/multiplayer-shared";
import { textDisplaySettings } from "@keybr/textinput";
import { type Focusable, TextArea } from "@keybr/textinput-ui";
import { useScreenSize } from "@keybr/widget";
import { EventEmitter } from "events";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type IntlShape, useIntl } from "react-intl";
import * as styles from "./Game.module.less";
import { DeferredTrack } from "./Track.tsx";
import { type Transport } from "./transport.ts";

const handleFocus = () => {};
const handleBlur = () => {};
const WORLD_CHANGE_EVENT = "world-change";

export const Game = ({
  transport,
}: {
  readonly transport: Transport<ServerMessage, ClientMessage>;
}): ReactNode => {
  const intl = useIntl();
  const wrapper = useMemo(
    () => new WorldStateWrapper(transport, intl),
    [transport, intl],
  );
  const [worldState, setWorldState] = useState(wrapper.worldState);
  const focusRef = useRef<Focusable>(null);
  useEffect(() => {
    const eventListener = (): void => {
      setWorldState(wrapper.worldState);
      switch (wrapper.worldState.gameState) {
        case GameState.STARTING:
        case GameState.RUNNING: {
          focusRef.current?.focus();
          break;
        }
      }
    };
    wrapper.on(WORLD_CHANGE_EVENT, eventListener);
    wrapper.connect();
    return () => {
      wrapper.off(WORLD_CHANGE_EVENT, eventListener);
      wrapper.disconnect();
    };
  }, [wrapper]);
  useScreenSize(); // Repaint on window resize.
  const { ticker, players, lines } = worldState;
  return (
    <div className={styles.game}>
      <DeferredTrack ticker={ticker} players={players} />
      <div className={styles.textArea}>
        <TextArea
          focusRef={focusRef}
          settings={textDisplaySettings}
          lines={lines}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={wrapper.handleInput}
        />
      </div>
    </div>
  );
};

class WorldStateWrapper extends EventEmitter {
  private _worldState: WorldState;

  constructor(
    readonly transport: Transport<ServerMessage, ClientMessage>,
    readonly intl: IntlShape,
  ) {
    super();
    this._worldState = makeWorldState(this.intl);
  }

  get worldState(): WorldState {
    return this._worldState;
  }

  setWorldState(worldState: WorldState): void {
    this._worldState = worldState;
    this.emit(WORLD_CHANGE_EVENT, worldState);
  }

  handleReceive = (message: ServerMessage): void => {
    this.setWorldState(updateWorldState(this.intl, this._worldState, message));
  };

  handleInput = (codePoint: number): void => {
    const result = handleInput(this._worldState, codePoint);
    if (result != null) {
      const { worldState, elapsed } = result;
      this.setWorldState(worldState);
      this.transport.send({
        type: PLAYER_PROGRESS_ID,
        elapsed,
        codePoint,
      });
    }
  };

  connect(): void {
    this.transport.addReceiver(this.handleReceive);
    this.transport.send({
      type: PLAYER_ANNOUNCE_ID,
      signature: 0xdeadbabe,
    });
  }

  disconnect(): void {
    this.transport.removeReceiver(this.handleReceive);
  }
}
