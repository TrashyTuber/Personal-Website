import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest runs without `globals: true`, so React Testing Library cannot
// auto-register its afterEach cleanup. Without this, rendered trees from one
// test leak into the next and queries find duplicate elements.
afterEach(cleanup);
