import { FakeIntlProvider } from "@keybr/intl";
import { PLAYER_KICKED } from "@keybr/multiplayer-shared";
import { act, render } from "@testing-library/react";
import test from "ava";
import { Connector } from "./Connector.tsx";
import { FakeWebSocket } from "./websocket.fake.ts";
import { useWebSocket } from "./websocket-hooks.ts";

test.serial("handle websocket ready state changes", (t) => {
  const webSocket = new FakeWebSocket("wss://www.keybr.com/game");

  useWebSocket.newWebSocket = () => webSocket;

  const r = render(
    <FakeIntlProvider>
      <Connector
        user={{
          id: null,
          name: "somebody",
          imageUrl: null,
        }}
      />
    </FakeIntlProvider>,
  );

  t.is(r.getByRole("heading").textContent, "Connecting to Server...");

  act(() => {
    webSocket.serverConnect();
  });
  act(() => {
    webSocket.serverClose(PLAYER_KICKED);
  });

  t.is(r.getByRole("heading").textContent, "Kicked out of the Game");

  r.unmount();
});
