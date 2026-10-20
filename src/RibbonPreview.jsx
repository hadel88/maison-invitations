import React from 'react';

// The closed view is baked from the same mesh and lighting as the opening.
export default function RibbonPreview({ className = '' }) {
  return <span className={'ribbon-preview ' + className} aria-hidden="true"><img src="/rose-ribbon-still.png" alt="" decoding="async"/></span>;
}
