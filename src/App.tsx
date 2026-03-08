import { useEffect } from "react";
import { Refine, Authenticated } from "@refinedev/core";
import { ThemedLayoutV2, ErrorComponent, RefineThemes, useNotificationProvider } from "@refinedev/antd";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import routerProvider, { NavigateToResource, CatchAllNavigate, DocumentTitleHandler, UnsavedChangesNotifier } from "@refinedev/react-router-v6";
import { useAuth0 } from "@auth0/auth0-react";
import dataProvider from "@refinedev/simple-rest";
import { ConfigProvider } from "antd";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/authProvider";
import { Login } from "./pages/login";
import { Dashboard } from "./pages/dashboard";
import { ProductList } from "./pages/products";
import { NotesList } from "./pages/notes"; // 새로 추가된 노트 리스트 페이지
import { setupApiInterceptor } from "./api/admin";


const App = () => {
    const auth0 = useAuth0();

    useEffect(() => {
        setupApiInterceptor(
            async () => {
                try {
                    return await auth0.getAccessTokenSilently();
                } catch {
                    return null;
                }
            },
            () => {
                auth0.loginWithRedirect();
            }
        );
    }, [auth0]);

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ConfigProvider theme={RefineThemes.Blue as any}>
                <Refine
                    dataProvider={dataProvider("https://api.fake-rest.refine.dev")}
                    notificationProvider={useNotificationProvider()}
                    routerProvider={routerProvider}
                    authProvider={authProvider(auth0)}
                    resources={[
                        {
                            name: "dashboard",
                            list: "/",
                        },
                        {
                            name: "products",
                            list: "/products",
                        },
                        {
                            name: "notes",
                            list: "/notes",
                        }
                    ]}
                    options={{
                        syncWithLocation: true,
                        warnWhenUnsavedChanges: true,
                        disableTelemetry: true,
                    }}
                >
                    <Routes>
                        <Route
                            element={
                                <Authenticated key="authenticated-routes" fallback={<CatchAllNavigate to="/login" />}>
                                    <ThemedLayoutV2>
                                        <Outlet />
                                    </ThemedLayoutV2>
                                </Authenticated>
                            }
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="/products" element={<ProductList />} />
                            <Route path="/notes" element={<NotesList />} />
                            <Route path="*" element={<ErrorComponent />} />
                        </Route>

                        <Route
                            element={
                                <Authenticated key="login-route" fallback={<Outlet />}>
                                    <NavigateToResource />
                                </Authenticated>
                            }
                        >
                            <Route path="/login" element={<Login />} />
                        </Route>
                    </Routes>
                    <UnsavedChangesNotifier />
                    <DocumentTitleHandler />
                </Refine>
            </ConfigProvider>
        </BrowserRouter>
    );
};

export default App;
