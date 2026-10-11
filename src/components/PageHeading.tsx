import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  children?: ReactNode;
}

export default function PageHeading({ title, description, children }: Props) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
