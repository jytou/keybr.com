import { Header, Para, Value } from "@keybr/widget";
import { type ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { type Summary } from "./Summary.tsx";

export function ComparisonSection({
  summary: { topProb, avgProb },
}: {
  readonly summary: Summary;
}): ReactNode {
  return (
    <>
      <Header level={2}>
        <FormattedMessage
          id="profile.chart.compareTitle"
          description="Section title."
          defaultMessage="Compare Yourself:"
        />
      </Header>

      <Para>
        <FormattedMessage
          id="profile.chart.compareTopSpeedText"
          description="Section paragraph."
          defaultMessage="Your all time top speed beats {value} of all other people."
          values={{
            value: <Value value={topProb} />,
          }}
        />
      </Para>

      <Para>
        <FormattedMessage
          id="profile.chart.compareAverageSpeedText"
          description="Section paragraph."
          defaultMessage="Your all time average speed beats {value} of all other people."
          values={{
            value: <Value value={avgProb} />,
          }}
        />
      </Para>
    </>
  );
}
