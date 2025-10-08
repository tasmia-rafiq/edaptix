import * as React from "react";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={(
        `rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition p-4",
        className
      `)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`(""group bg-white border border-slate-300 rounded-lg shadow-sm p-5 hover:shadow-md transition"", className)`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={(`text-lg font-semibold text-gray-800", className`)}
      {...props}
    >
      {children}
    </h3>
  );
}
