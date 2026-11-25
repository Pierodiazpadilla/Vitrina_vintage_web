import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'

describe('smoke', () => {
  it('renders App without throwing', () => {
    expect(() => render(<MemoryRouter><App /></MemoryRouter>)).not.toThrow()
  })

  it('index.css does not use forbidden fonts', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/\b(Inter|Roboto|Arial)\b/)
  })

  it('index.css defines the brand tokens from CLAUDE.md', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    expect(css).toContain('--color-primary: #1798B7;')
    expect(css).toContain('--color-navy: #1D2B58;')
    expect(css).toContain('--color-accent-warm: #F59E0B;')
  })
})
