import { useLogin } from "@refinedev/core";
import { Button, Layout, Space, Typography } from "antd";
import { GoogleOutlined } from "@ant-design/icons";

export const Login = () => {
    const { mutate: login, isPending } = useLogin();

    return (
        <Layout
            style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Space direction="vertical" align="center" size="large">
                <Typography.Title level={2}>
                    Barcode Taste Note Admin
                </Typography.Title>
                <Button
                    type="primary"
                    size="large"
                    icon={<GoogleOutlined />}
                    loading={isPending}
                    onClick={() => login({})}
                >
                    Sign in with Google
                </Button>
            </Space>
        </Layout>
    );
};
