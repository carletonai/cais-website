import React from "react";

const Governance = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Governance</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Download the CAIS constitution below.
      </p>
      <a
        href="/constitution.pdf"
        className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Download CAIS Constitution
      </a>
    </div>
  );
};

export default Governance;
