
interface SectionHeadProps {
  index: string;
  label: string;
  meta?: string;
}

/** Thin-ruled section header: index, label and optional right-hand meta. */
export default function SectionHead({ index, label, meta }: SectionHeadProps) {
  return (
    <div className="sec-head" data-reveal>
      <span className="sec-head__idx">{index}</span>
      <span className="sec-head__label">{label}</span>
      {meta ? <span className="sec-head__meta">{meta}</span> : null}
    </div>
  );
}

