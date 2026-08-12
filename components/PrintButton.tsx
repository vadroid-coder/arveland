"use client";

export default function PrintButton({
  className = "btn btn-primary",
  children = "Prindi / PDF",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  );
}
