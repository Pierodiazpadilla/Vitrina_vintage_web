import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { adminSession, renderAdmin } from './adminHelpers.jsx'

describe('AdminGuard y login', () => {
  it('sin sesión redirige al login guardando a dónde iba', async () => {
    renderAdmin('/admin/productos', { session: adminSession('anon') })
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/admin/login?next=%2Fadmin%2Fproductos'))
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('una cuenta que no está en admins ve "Esta cuenta no tiene acceso"', () => {
    renderAdmin('/admin/revision', { session: adminSession('not-admin') })
    expect(screen.getByText('Esta cuenta no tiene acceso')).toBeInTheDocument()
  })

  it('el admin entra al panel', async () => {
    renderAdmin('/admin')
    expect(await screen.findByRole('navigation', { name: 'Panel' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/admin/revision'))
  })

  it('el login envía correo y contraseña', async () => {
    const session = adminSession('anon')
    renderAdmin('/admin/login', { session })
    await userEvent.type(screen.getByLabelText('Correo'), 'dueno@example.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(session.signIn).toHaveBeenCalledWith('dueno@example.com', 'secreta')
  })

  it('ya con sesión de admin, el login lleva a "next"', async () => {
    renderAdmin('/admin/login?next=%2Fadmin%2Fnuevo')
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/admin/nuevo'))
  })

  it('el panel no se indexa', () => {
    renderAdmin('/admin/revision')
    expect(document.head.querySelector('meta[name="robots"]')?.content).toMatch(/noindex/)
  })
})
