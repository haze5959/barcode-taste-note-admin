import React, { useState, useEffect } from "react";
import {
    Table,
    Button,
    Modal,
    Descriptions,
    Input,
    message,
    Tag,
    Typography,
    Spin,
    Image,
} from "antd";
import { getReports, updateReport, getUserDetail, getProductDetail } from "../../api/admin";
import { Report } from "../../types/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ReportsList: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [reply, setReply] = useState<string>("");
    const [sending, setSending] = useState<boolean>(false);

    // Detail states for the modal
    const [targetUser, setTargetUser] = useState<any>(null);
    const [targetProduct, setTargetProduct] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState<boolean>(false);

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await getReports();
            // Sort by registered date descending (newest first)
            const sortedData = [...data].sort((a, b) =>
                new Date(b.registered).getTime() - new Date(a.registered).getTime()
            );
            setReports(sortedData);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            message.error("신고 목록을 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleRowClick = async (record: Report) => {
        setSelectedReport(record);
        setReply(record.reply || "");
        setIsModalVisible(true);

        setDetailLoading(true);
        setTargetUser(null);
        setTargetProduct(null);
        try {
            const userReq = getUserDetail(record.user_id).catch(() => null);
            const productReq = record.type === 1 
                ? Promise.resolve(null)
                : getProductDetail(record.product_id).catch(() => null);

            const [userRes, productRes] = await Promise.all([userReq, productReq]);
            
            setTargetUser(userRes);

            if (productRes && productRes.image_ids) {
                productRes.image_ids = productRes.image_ids.slice(0, 3);
            }
            setTargetProduct(productRes);
        } catch (error) {
            console.error("Failed to load details:", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedReport) return;
        if (!reply.trim()) {
            message.warning("답변 내용을 입력해주세요.");
            return;
        }

        setSending(true);
        try {
            await updateReport(selectedReport.id, reply);
            message.success("답변이 성공적으로 등록되었습니다.");
            setIsModalVisible(false);
            loadReports(); // Refresh list
        } catch (error) {
            console.error("Failed to update report:", error);
        } finally {
            setSending(false);
        }
    };

    const columns = [
        {
            title: "신고 종류",
            dataIndex: "type",
            key: "type",
            render: (type: number) => {
                const typeMap: Record<number, string> = {
                    0: "제품 신고",
                    1: "기타"
                };
                return <Tag color="orange">{typeMap[type] || `기타(${type})`}</Tag>;
            },
        },
        {
            title: "신고 내용 (요약)",
            dataIndex: "body",
            key: "body",
            ellipsis: true,
            render: (text: string) => text.substring(0, 30) + (text.length > 30 ? "..." : ""),
        },
        {
            title: "상태",
            dataIndex: "reply",
            key: "status",
            render: (reply: string) => (
                reply ? <Tag color="green">답변 완료</Tag> : <Tag color="default">대기 중</Tag>
            ),
        },
        {
            title: "등록일",
            dataIndex: "registered",
            key: "registered",
            render: (val: string) => new Date(val).toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            }),
        },
    ];

    return (
        <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
            <Title level={2} style={{ marginBottom: "24px" }}>
                🚩 신고 관리 리스트 (Reports)
            </Title>

            <Table<Report>
                dataSource={reports}
                columns={columns}
                rowKey="id"
                loading={loading}
                onRow={(record: Report) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: "pointer" }
                })}
            />

            <Modal
                title={<Title level={3}>신고 상세 정보</Title>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalVisible(false)}>
                        닫기
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={sending}
                        onClick={handleSendReply}
                    >
                        답변 전송
                    </Button>,
                ]}
                width={700}
                destroyOnClose
            >
                {selectedReport && (
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: "150px", fontWeight: "bold" }}>
                        <Descriptions.Item label="신고 ID">{selectedReport.id}</Descriptions.Item>
                        <Descriptions.Item label="Product ID">{selectedReport.product_id}</Descriptions.Item>
                        <Descriptions.Item label="신고 유저 ID">{selectedReport.user_id}</Descriptions.Item>
                        <Descriptions.Item label="신고 일시">
                            {new Date(selectedReport.registered).toLocaleString('ko-KR')}
                        </Descriptions.Item>
                        <Descriptions.Item label="신고 내용">
                            <div style={{ maxWidth: 480, whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#f9f9f9", padding: "12px", borderRadius: "8px" }}>
                                {selectedReport.body}
                            </div>
                        </Descriptions.Item>
                        <Descriptions.Item label="신고 유저 상세">
                            {detailLoading ? (
                                <Spin size="small" />
                            ) : targetUser ? (
                                <pre style={{ maxWidth: 480, margin: 0, padding: "8px", background: "#f5f5f5", borderRadius: "4px", fontSize: "11px", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "200px", overflowY: "auto" }}>
                                    {JSON.stringify(targetUser, null, 2)}
                                </pre>
                            ) : (
                                <Text type="secondary">유저 정보가 없습니다.</Text>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="신고 제품 상세">
                            {detailLoading ? (
                                <Spin size="small" />
                            ) : targetProduct ? (
                                <div style={{ maxWidth: 480, overflow: "hidden" }}>
                                    <pre style={{ margin: 0, padding: "8px", background: "#f5f5f5", borderRadius: "4px", fontSize: "11px", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "200px", overflowY: "auto" }}>
                                        {JSON.stringify(targetProduct, null, 2)}
                                    </pre>
                                    {targetProduct.image_ids && targetProduct.image_ids.length > 0 && (
                                        <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {targetProduct.image_ids.slice(0, 3).map((imgId: string) => (
                                                <Image
                                                    key={imgId}
                                                    src={`/images/${imgId}`}
                                                    width={100}
                                                    height={100}
                                                    style={{ objectFit: "cover", borderRadius: "8px", border: "1px solid #e8e8e8" }}
                                                    fallback="https://via.placeholder.com/100?text=No+Image"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Text type="secondary">제품 정보가 없습니다.</Text>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="관리자 답변">
                            <TextArea
                                placeholder="신고에 대한 답변을 입력하세요..."
                                value={reply}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReply(e.target.value)}
                                rows={6}
                            />
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};
