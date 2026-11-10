'use client';
import { Children, useState } from 'react';

// Seznam, který ukáže prvních `visible` položek; zbytek po klepnutí na „další" (vždy dole).
export default function MoreList({ visible = 3, children }) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const shown = open ? items : items.slice(0, visible);
  return (
    <>
      <ul className="months">{shown}</ul>
      {items.length > visible && (
        <button type="button" className="link more-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'méně' : 'další'}
        </button>
      )}
    </>
  );
}
