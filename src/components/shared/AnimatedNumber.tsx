import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  formatter: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, formatter, className }: AnimatedNumberProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey((previous) => previous + 1);
  }, [value]);

  return (
    <span key={animationKey} className={className}>
      <span className="inline-block animate-valueFlash">{formatter(value)}</span>
    </span>
  );
}
