import React, { useState, useEffect } from "react";
import {
    Table,
    Modal,
    Descriptions,
    Typography,
    Space,
    Tag,
    Rate,
    Image,
} from "antd";
import { fetchNotes } from "../../api/admin";
import { NoteInfo, PublicScope } from "../../types/api";

const { Title } = Typography;

export const NotesList: React.FC = () => {
    // List States
    const [notes, setNotes] = useState<NoteInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);

    // Modal States
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [selectedNote, setSelectedNote] = useState<NoteInfo | null>(null);

    const loadNotes = async (page: number) => {
        setLoading(true);
        try {
            const data = await fetchNotes(page);
            setNotes(data);
            setHasMore(data.length === 20); // per=20
        } catch (error) {
            console.error("Failed to fetch notes:", error);
            // message.error is handled within apiFetch
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotes(currentPage);
    }, [currentPage]);

    const handleRowClick = (record: NoteInfo) => {
        setSelectedNote(record);
        setIsModalVisible(true);
    };

    const renderPublicScope = (scope: PublicScope) => {
        switch (scope) {
            case PublicScope.Private:
                return <Tag color="default">비공개</Tag>;
            case PublicScope.FriendsOnly:
                return <Tag color="green">친구 공개</Tag>;
            case PublicScope.Public:
                return <Tag color="blue">전체 공개</Tag>;
            default:
                return <Tag>{scope}</Tag>;
        }
    };

    const columns = [
        {
            title: "노트 본문 요약",
            dataIndex: ["note", "body"],
            key: "body",
            render: (text: string) => (text.length > 30 ? text.substring(0, 30) + "..." : text),
        },
        {
            title: "제품명",
            dataIndex: ["product", "name"],
            key: "product_name",
        },
        {
            title: "별점",
            dataIndex: ["note", "rating"],
            key: "rating",
            render: (val: number | null) => val != null ? <Rate disabled allowHalf value={val / 2} /> : "-",
        },
        {
            title: "공개 범위",
            dataIndex: ["note", "public_scope"],
            key: "public_scope",
            render: (scope: PublicScope) => renderPublicScope(scope),
        },
        {
            title: "작성자",
            dataIndex: ["user", "nick_name"],
            key: "user_name",
            render: (name?: string) => name || "알 수 없음",
        },
        {
            title: "작성일",
            dataIndex: ["note", "registered"],
            key: "registered",
            render: (val: string) => new Date(val).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        },
    ];

    return (
        <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
            <Title level={2} style={{ marginBottom: "24px" }}>
                📝 신규 노트 보기 (Notes List)
            </Title>

            <Table<NoteInfo>
                dataSource={notes}
                columns={columns}
                rowKey={(record) => record.note.id}
                loading={loading}
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: "pointer" }
                })}
                pagination={{
                    current: currentPage + 1,
                    pageSize: 20,
                    total: hasMore ? (currentPage + 2) * 20 : (currentPage * 20) + notes.length,
                    onChange: (page) => setCurrentPage(page - 1)
                }}
            />

            <Modal
                title={<Title level={3}>노트 상세</Title>}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setSelectedNote(null);
                }}
                footer={null}
                width={700}
                destroyOnClose
            >
                {selectedNote ? (
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: "150px", fontWeight: "bold" }}>
                        <Descriptions.Item label="노트 ID">{selectedNote.note.id}</Descriptions.Item>
                        <Descriptions.Item label="작성자">
                            {selectedNote.user?.nick_name || "알 수 없음"} {selectedNote.user?.id ? `(${selectedNote.user.id})` : ""}
                        </Descriptions.Item>
                        <Descriptions.Item label="제품명">{selectedNote.product.name}</Descriptions.Item>
                        <Descriptions.Item label="노트 본문" style={{ whiteSpace: "pre-wrap" }}>
                            {selectedNote.note.body}
                        </Descriptions.Item>
                        <Descriptions.Item label="참조 이미지">
                            {selectedNote.image_ids && selectedProductImages(selectedNote.image_ids)}
                            {!selectedNote.image_ids && selectedNote.product_image_id && selectedProductImages([selectedNote.product_image_id])}
                            {(!selectedNote.image_ids || selectedNote.image_ids.length === 0) && !selectedNote.product_image_id && "이미지 없음"}
                        </Descriptions.Item>
                        <Descriptions.Item label="별점">
                            {selectedNote.note.rating != null ? <Rate disabled allowHalf value={selectedNote.note.rating / 2} /> : "-"} ({selectedNote.note.rating}점)
                        </Descriptions.Item>
                        <Descriptions.Item label="플레이버 (Flavors)">
                            {selectedNote.flavors && selectedNote.flavors.length > 0 ? (
                                selectedNote.flavors.map(f => <Tag key={f.id} color="cyan">{f.name}</Tag>)
                            ) : (
                                "선택 안함"
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="세부 평가 (Details)">
                            {selectedNote.note.details && Object.keys(selectedNote.note.details).length > 0 ? (
                                Object.entries(selectedNote.note.details).map(([key, val]) => (
                                    <Tag key={key} color="purple">{key}: {val}</Tag>
                                ))
                            ) : (
                                "없음"
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="공개 범위">
                            {renderPublicScope(selectedNote.note.public_scope)}
                        </Descriptions.Item>
                        <Descriptions.Item label="작성일시">
                            {new Date(selectedNote.note.registered).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#888" }}>
                        데이터가 없습니다.
                    </div>
                )}
            </Modal>
        </div>
    );
};

// 단순 이미지 렌더링 헬퍼 
const selectedProductImages = (ids: string[]) => {
    if (!ids || ids.length === 0) return null;
    return (
        <Space wrap>
            {ids.map(id => (
                <Image
                    key={id}
                    width={100}
                    height={100}
                    src={`/static/images/${id}`}
                    alt="노트 이미지"
                    style={{ objectFit: "cover", borderRadius: "8px" }}
                    fallback="https://via.placeholder.com/100?text=No+Image"
                />
            ))}
        </Space>
    );
};
