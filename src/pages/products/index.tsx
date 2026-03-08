import React, { useState, useEffect } from "react";
import {
    Table,
    Input,
    message,
    Modal,
    Descriptions,
    Spin,
    Typography,
    Space,
    Tag,
    Rate,
    Image,
} from "antd";
import { fetchProducts, getProductDetail } from "../../api/admin";
import { ProductInfo } from "../../types/api";

const PRODUCT_TYPES = ["whisky", "wine", "beer", "soju", "liqueur", "cocktail", "coffee", "beverage", "other"];

const { Title } = Typography;
const { Search } = Input;

export const ProductList: React.FC = () => {
    // List States
    const [products, setProducts] = useState<ProductInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchText, setSearchText] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(0); // 0-indexed as per Swift API spec usually, or adapt to 1
    const [hasMore, setHasMore] = useState<boolean>(true); // For simple next/prev pagination

    // Modal States
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
    const [modalLoading, setModalLoading] = useState<boolean>(false);

    const loadProducts = async (search: string, page: number) => {
        setLoading(true);
        try {
            const data = await fetchProducts(search || null, page);
            // Since there's no totalCount, if we get fewer than 20 items, we assume there are no more pages.
            setProducts(data);
            setHasMore(data.length === 20);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            message.error("제품 목록을 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts(searchText, currentPage);
    }, [currentPage]);

    const handleSearch = (value: string) => {
        setSearchText(value);
        setCurrentPage(0); // Reset to first page
        loadProducts(value, 0);
    };

    const handleRowClick = async (record: ProductInfo) => {
        setIsModalVisible(true);
        setModalLoading(true);
        try {
            const detail = await getProductDetail(record.product.id);
            setSelectedProduct(detail);
        } catch (error) {
            console.error("Failed to fetch product detail:", error);
            message.error("제품 상세 정보를 불러오는 데 실패했습니다.");
            setIsModalVisible(false);
        } finally {
            setModalLoading(false);
        }
    };

    const columns = [
        {
            title: "이름",
            dataIndex: ["product", "name"],
            key: "name",
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: "타입",
            dataIndex: ["product", "type"],
            key: "type",
            render: (type: number) => <Tag color="blue">{PRODUCT_TYPES[type] || String(type)}</Tag>,
        },
        {
            title: "별점",
            dataIndex: ["product", "rating"],
            key: "rating",
            render: (val: number | null) => val != null ? <Rate disabled allowHalf value={val / 2} /> : "-",
        },
        {
            title: "노트 수",
            dataIndex: ["product", "note_count"],
            key: "note_count",
            render: (val?: number) => `${val ?? 0}개`,
        },
        {
            title: "등록일",
            dataIndex: ["product", "registered"],
            key: "registered",
            render: (val: string) => new Date(val).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        },
    ];

    return (
        <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
            <Title level={2} style={{ marginBottom: "24px" }}>
                🏷️ 신규 추가 제품 보기 (Product List)
            </Title>

            <Space style={{ marginBottom: 16 }}>
                <Search
                    placeholder="제품 이름을 검색하세요"
                    onSearch={handleSearch}
                    enterButton
                    style={{ width: 400 }}
                    size="large"
                />
            </Space>

            <Table<ProductInfo>
                dataSource={products}
                columns={columns}
                rowKey={(record) => record.product.id}
                loading={loading}
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: "pointer" }
                })}
                pagination={{
                    current: currentPage + 1, // Antd is 1-indexed for display
                    pageSize: 20,
                    total: hasMore ? (currentPage + 2) * 20 : (currentPage * 20) + products.length,
                    onChange: (page) => setCurrentPage(page - 1)
                }}
            />

            <Modal
                title={<Title level={3}>{selectedProduct?.product.name || "제품 상세"}</Title>}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setSelectedProduct(null);
                }}
                footer={null}
                width={700}
                destroyOnClose
            >
                {modalLoading ? (
                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                        <Spin tip="상세 정보를 불러오는 중입니다..." size="large">
                            <div style={{ height: "50px" }} />
                        </Spin>
                    </div>
                ) : selectedProduct ? (
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: "150px", fontWeight: "bold" }}>
                        <Descriptions.Item label="고유 ID">{selectedProduct.product.id}</Descriptions.Item>
                        <Descriptions.Item label="제품명">{selectedProduct.product.name}</Descriptions.Item>
                        <Descriptions.Item label="타입">{PRODUCT_TYPES[selectedProduct.product.type] || String(selectedProduct.product.type)}</Descriptions.Item>
                        <Descriptions.Item label="설명">{selectedProduct.product.desc || "-"}</Descriptions.Item>
                        <Descriptions.Item label="평점">{selectedProduct.product.rating != null ? <Rate disabled allowHalf value={selectedProduct.product.rating / 2} /> : "-"}</Descriptions.Item>
                        <Descriptions.Item label="노트 수">{selectedProduct.product.note_count ?? 0}</Descriptions.Item>
                        <Descriptions.Item label="즐겨찾기 수">{selectedProduct.favorite_count ?? "-"}</Descriptions.Item>
                        <Descriptions.Item label="등록일">{new Date(selectedProduct.product.registered).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Descriptions.Item>
                        <Descriptions.Item label="플레이버 정보">
                            {selectedProduct.product.flavor_infos ? (
                                <pre style={{ margin: 0 }}>{JSON.stringify(selectedProduct.product.flavor_infos, null, 2)}</pre>
                            ) : (
                                "-"
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="제품 이미지">
                            {selectedProduct.image_ids && selectedProduct.image_ids.length > 0 ? (
                                <Space wrap>
                                    {selectedProduct.image_ids.map((id: string) => (
                                        <Image
                                            key={id}
                                            width={100}
                                            height={100}
                                            src={`/static/images/${id}`}
                                            alt="제품 이미지"
                                            style={{ objectFit: "cover", borderRadius: "8px" }}
                                            fallback="https://via.placeholder.com/100?text=No+Image"
                                        />
                                    ))}
                                </Space>
                            ) : (
                                "이미지 없음"
                            )}
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
