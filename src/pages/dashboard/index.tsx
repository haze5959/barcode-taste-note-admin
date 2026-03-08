import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Spin, Typography, Button, message } from "antd";
import { Link } from "react-router-dom";
import {
    UserAddOutlined,
    UserOutlined,
    AppstoreAddOutlined,
    ProfileOutlined,
    WarningOutlined,
    MergeCellsOutlined,
    PictureOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { getDashboard } from "../../api/admin";
import { DashboardStats } from "../../types/api";

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const data = await getDashboard();
                setStats(data);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                message.error("대시보드 데이터를 가져오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    return (
        <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
            <Title level={2} style={{ marginBottom: "24px", fontWeight: "bold" }}>
                📊 대시보드
            </Title>

            {loading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Spin size="large" tip="데이터를 불러오는 중입니다..." />
                </div>
            ) : (
                <>
                    {/* Statistics Section */}
                    <Title level={4} style={{ marginBottom: "16px", marginTop: "16px" }}>지표 요약</Title>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Card hoverable style={{ borderRadius: "12px", borderLeft: "5px solid #1890ff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <Statistic
                                    title={<Text strong>총 가입 유저 수</Text>}
                                    value={stats?.registered_user_count ?? 0}
                                    prefix={<UserOutlined style={{ color: "#1890ff" }} />}
                                    suffix="명"
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card hoverable style={{ borderRadius: "12px", borderLeft: "5px solid #52c41a", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <Statistic
                                    title={<Text strong>최근 30일 가입 유저 수</Text>}
                                    value={stats?.monthly_registered_user_count ?? 0}
                                    prefix={<UserAddOutlined style={{ color: "#52c41a" }} />}
                                    suffix="명"
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card hoverable style={{ borderRadius: "12px", borderLeft: "5px solid #722ed1", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <Statistic
                                    title={<Text strong>등록된 제품 수</Text>}
                                    value={stats?.product_count ?? 0}
                                    prefix={<AppstoreAddOutlined style={{ color: "#722ed1" }} />}
                                    suffix="개"
                                />
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                            <Card hoverable style={{ borderRadius: "12px", borderLeft: "5px solid #faad14", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <Statistic
                                    title={<Text strong>최근 30일 등록 노트 수</Text>}
                                    value={stats?.monthly_note_count ?? 0}
                                    prefix={<CalendarOutlined style={{ color: "#faad14" }} />}
                                    suffix="개"
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card hoverable style={{ borderRadius: "12px", borderLeft: "5px solid #fa8c16", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <Statistic
                                    title={<Text strong>최근 24시간 등록 노트 수</Text>}
                                    value={stats?.daily_note_count ?? 0}
                                    prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
                                    suffix="개"
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card hoverable style={{ borderRadius: "12px", borderLeft: "5px solid #f5222d", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <Statistic
                                    title={<Text strong>응답 대기중인 신고 수</Text>}
                                    value={stats?.not_reply_report_count ?? 0}
                                    prefix={<WarningOutlined style={{ color: "#f5222d" }} />}
                                    valueStyle={{ color: stats?.not_reply_report_count ? "#cf1322" : "inherit" }}
                                    suffix="건"
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Quick Actions Section */}
                    <Title level={4} style={{ marginTop: "40px", marginBottom: "16px" }}>바로가기 관리 메뉴</Title>
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8} md={4}>
                            <Link to="/products">
                                <Button block size="large" type="primary" ghost icon={<AppstoreAddOutlined style={{ fontSize: '24px' }} />} style={{ height: "100px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                    <Text strong>신규 제품 보기</Text>
                                </Button>
                            </Link>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Link to="/notes/new">
                                <Button block size="large" type="primary" ghost icon={<ProfileOutlined style={{ fontSize: '24px' }} />} style={{ height: "100px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                    <Text strong>신규 노트 보기</Text>
                                </Button>
                            </Link>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Link to="/products/edit">
                                <Button block size="large" icon={<AppstoreAddOutlined style={{ fontSize: '24px', color: '#722ed1' }} />} style={{ height: "100px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px", borderColor: '#722ed1' }}>
                                    <Text strong style={{ color: '#722ed1' }}>제품 정보 수정</Text>
                                </Button>
                            </Link>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Link to="/reports">
                                <Button block size="large" danger icon={<WarningOutlined style={{ fontSize: '24px' }} />} style={{ height: "100px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                    <Text strong type="danger">신고 리스트</Text>
                                </Button>
                            </Link>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Link to="/products/merge">
                                <Button block size="large" type="dashed" icon={<MergeCellsOutlined style={{ fontSize: '24px' }} />} style={{ height: "100px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                    <Text strong type="secondary">제품 Merge</Text>
                                </Button>
                            </Link>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Link to="/products/image">
                                <Button block size="large" type="dashed" icon={<PictureOutlined style={{ fontSize: '24px' }} />} style={{ height: "100px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                    <Text strong type="secondary">메인 이미지 변경</Text>
                                </Button>
                            </Link>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};
