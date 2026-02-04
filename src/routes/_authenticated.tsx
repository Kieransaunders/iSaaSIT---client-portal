import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start';
import { MainLayout } from '@/components/layout/main-layout';

export const Route = createFileRoute('/_authenticated')({
  loader: async ({ location }) => {
    const { user } = await getAuth();
    if (!user) {
      const path = location.pathname;
      const href = await getSignInUrl({ data: { returnPathname: path } });
      throw redirect({ href });
    }
    // Return user info that can be used by child routes
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // Get user from loader data to pass to layout if needed
  const { user } = Route.useLoaderData();
  
  return (
    <MainLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <Outlet />
    </MainLayout>
  );
}
