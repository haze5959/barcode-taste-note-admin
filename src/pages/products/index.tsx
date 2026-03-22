import React, { useState, useEffect } from "react";
import {
    Table,
    Input,
    Button,
    message,
    Modal,
    Descriptions,
    Spin,
    Typography,
    Space,
    Tag,
    Rate,
    Image,
    Card,
    Select,
} from "antd";
import { fetchProducts, getProductDetail, updateProduct, updateImage, getMainImage, uploadImage, mergeProduct, getProductBarcodes, updateImageUrl } from "../../api/admin";
import { ProductInfo, UpdateProductRequest } from "../../types/api";

const PRODUCT_TYPES = ["whisky", "wine", "beer", "soju/sake", "liqueur/spirit", "cocktail", "coffee", "beverage", "other"];

const { Title, Text } = Typography;
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

    // Edit States
    const [editForm, setEditForm] = useState<{ name: string; desc: string; type: number }>({ name: "", desc: "", type: 0 });
    const [mainImageId, setMainImageId] = useState<string | null>(null);
    const [isModified, setIsModified] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [barcodes, setBarcodes] = useState<string[]>([]);

    // Image URL States
    const [imageUrlInput, setImageUrlInput] = useState<string>("");
    const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);

    // Merge States
    const [toProductId, setToProductId] = useState<string>("");
    const [mergeConfirmVisible, setMergeConfirmVisible] = useState<boolean>(false);
    const [toProductDetail, setToProductDetail] = useState<ProductInfo | null>(null);
    const [merging, setMerging] = useState<boolean>(false);

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
            const [detail, mainImage, barcodeList] = await Promise.all([
                getProductDetail(record.product.id),
                getMainImage(record.product.id),
                getProductBarcodes(record.product.id)
            ]);

            setSelectedProduct(detail);
            setMainImageId(mainImage.image_id);
            setBarcodes(barcodeList);
            setEditForm({
                name: detail.product.name,
                desc: detail.product.desc || "",
                type: detail.product.type
            });
            setIsModified(false);
        } catch (error) {
            console.error("Failed to fetch product detail or main image:", error);
            message.error("제품 상세 정보를 불러오는 데 실패했습니다.");
            setIsModalVisible(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleInputChange = (field: "name" | "desc" | "type", value: string | number) => {
        const newForm = { ...editForm, [field]: value };
        setEditForm(newForm as any);

        if (selectedProduct) {
            const isNameModified = newForm.name !== selectedProduct.product.name;
            const isDescModified = newForm.desc !== (selectedProduct.product.desc || "");
            const isTypeModified = newForm.type !== selectedProduct.product.type;
            setIsModified(isNameModified || isDescModified || isTypeModified);
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedProduct) return;

        setSaving(true);
        const updateData: UpdateProductRequest = {
            product_id: selectedProduct.product.id,
        };

        if (editForm.name !== selectedProduct.product.name) updateData.name = editForm.name;
        if (editForm.desc !== (selectedProduct.product.desc || "")) updateData.desc = editForm.desc;
        if (editForm.type !== selectedProduct.product.type) updateData.type = editForm.type;

        try {
            await updateProduct(updateData);
            message.success("제품 정보가 수정되었습니다.");
            setIsModified(false);
            // Refresh detail and list
            const updatedDetail = await getProductDetail(selectedProduct.product.id);
            setSelectedProduct(updatedDetail);
            loadProducts(searchText, currentPage);
        } catch (error) {
            console.error("Failed to update product:", error);
            // Error message is already handled in apiFetch
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = async (imageId: string | null, file: File) => {
        if (!selectedProduct) return;

        const hideLoading = message.loading(imageId ? "이미지를 변경 중입니다..." : "이미지를 등록 중입니다...", 0);
        try {
            if (imageId) {
                // 기존 이미지 수정
                await updateImage(imageId, file);
                message.success("이미지가 성공적으로 변경되었습니다.");
            } else {
                // 신규 이미지 등록
                await uploadImage(file, selectedProduct.product.id);
                message.success("이미지가 성공적으로 등록되었습니다.");
            }

            // Refresh main image
            const mainImage = await getMainImage(selectedProduct.product.id);
            setMainImageId(mainImage.image_id);

            // Also refresh detail for consistency if needed
            const detail = await getProductDetail(selectedProduct.product.id);
            setSelectedProduct(detail);
        } catch (error) {
            console.error("Failed to update or upload image:", error);
            // Error already handled in apiFetch
        } finally {
            hideLoading();
        }
    };

    const handleImageUrlSubmit = async (imageId: string | null) => {
        if (!imageUrlInput.trim()) {
            message.warning("이미지 URL을 입력해주세요.");
            return;
        }
        if (!selectedProduct) return;

        const targetImageId = imageId || crypto.randomUUID();
        const hideLoading = message.loading("이미지 URL을 전송 중입니다...", 0);
        setIsFetchingUrl(true);
        try {
            await updateImageUrl(targetImageId, imageUrlInput);
            message.success("이미지가 성공적으로 변경/등록되었습니다.");
            
            // Refresh main image
            const mainImage = await getMainImage(selectedProduct.product.id);
            setMainImageId(mainImage.image_id);
            setImageUrlInput("");
        } catch (error) {
            console.error("Failed to update image from URL:", error);
            // Error handling is already in apiFetch
        } finally {
            hideLoading();
            setIsFetchingUrl(false);
        }
    };

    const handleMergeClick = async () => {
        if (!toProductId.trim()) {
            message.warning("병합할 대상 제품 ID를 입력해주세요.");
            return;
        }
        if (selectedProduct && toProductId === selectedProduct.product.id) {
            message.warning("자기 자신과 병합할 수 없습니다.");
            return;
        }

        setModalLoading(true);
        try {
            const detail = await getProductDetail(toProductId);
            setToProductDetail(detail);
            setMergeConfirmVisible(true);
        } catch (error) {
            console.error("Failed to fetch target product detail for merge:", error);
            message.error("대상 제품 정보를 가져오는데 실패했습니다. ID를 확인해주세요.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleFinalMerge = async () => {
        if (!selectedProduct || !toProductId) return;

        setMerging(true);
        try {
            await mergeProduct(selectedProduct.product.id, toProductId);
            message.success("제품이 성공적으로 병합되었습니다.");
            setMergeConfirmVisible(false);
            setIsModalVisible(false);
            setToProductId("");
            setToProductDetail(null);
            loadProducts(searchText, currentPage);
        } catch (error) {
            console.error("Merge failed:", error);
        } finally {
            setMerging(false);
        }
    };

    const columns = [
        {
            title: "이름",
            dataIndex: ["product", "name"],
            key: "name",
            width: 280,
            ellipsis: true,
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: "타입",
            dataIndex: ["product", "type"],
            key: "type",
            width: 140,
            render: (type: number) => <Tag color="blue">{PRODUCT_TYPES[type] || String(type)}</Tag>,
        },
        {
            title: "별점",
            dataIndex: ["product", "rating"],
            key: "rating",
            width: 200,
            render: (val: number | null) => val != null ? <Rate disabled allowHalf value={val / 2} /> : "-",
        },
        {
            title: "노트 수",
            dataIndex: ["product", "note_count"],
            key: "note_count",
            width: 90,
            render: (val?: number) => `${val ?? 0}개`,
        },
        {
            title: "등록일",
            dataIndex: ["product", "registered"],
            key: "registered",
            width: 160,
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
                scroll={{ x: "max-content" }}
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
                    setMainImageId(null);
                    setBarcodes([]);
                    setToProductId("");
                    setToProductDetail(null);
                    setImageUrlInput("");
                }}
                footer={[
                    <Button key="back" onClick={() => setIsModalVisible(false)}>
                        닫기
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        disabled={!isModified || saving}
                        loading={saving}
                        onClick={handleSaveChanges}
                    >
                        수정
                    </Button>
                ]}
                width={700}
                destroyOnClose
                style={{ top: 20 }}
                styles={{ body: { overflowY: "auto", maxHeight: "calc(80vh - 120px)" } }}
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
                        <Descriptions.Item label="제품명">
                            <Input
                                value={editForm.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label="타입">
                            <Select
                                value={editForm.type}
                                onChange={(value) => handleInputChange("type", value)}
                                style={{ width: "100%" }}
                            >
                                {PRODUCT_TYPES.map((type, index) => (
                                    <Select.Option key={index} value={index}>
                                        {type}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Descriptions.Item>
                        <Descriptions.Item label="설명">
                            <Input.TextArea
                                value={editForm.desc}
                                onChange={(e) => handleInputChange("desc", e.target.value)}
                                rows={4}
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label="평점">{selectedProduct.product.rating != null ? <Rate disabled allowHalf value={selectedProduct.product.rating / 2} /> : "-"}</Descriptions.Item>
                        <Descriptions.Item label="노트 수">{selectedProduct.product.note_count ?? 0}</Descriptions.Item>
                        <Descriptions.Item label="즐겨찾기 수">{selectedProduct.favorite_count ?? "-"}</Descriptions.Item>
                        <Descriptions.Item label="바코드">
                            {barcodes.length > 0 ? (
                                <Space size={[4, 6]} wrap>
                                    {barcodes.map((barcode) => (
                                        <Tag key={barcode} color="geekblue" style={{ fontFamily: "monospace", fontSize: "13px" }}>
                                            {barcode}
                                        </Tag>
                                    ))}
                                </Space>
                            ) : (
                                <Text type="secondary">등록된 바코드가 없습니다.</Text>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="등록일">{new Date(selectedProduct.product.registered).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Descriptions.Item>
                        <Descriptions.Item label="플레이버 정보">
                            {selectedProduct.product.flavor_infos ? (
                                <pre style={{ margin: 0 }}>{JSON.stringify(selectedProduct.product.flavor_infos, null, 2)}</pre>
                            ) : (
                                "-"
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="제품 이미지">
                            {mainImageId ? (
                                <div style={{ textAlign: "center", width: "fit-content" }}>
                                    <Image
                                        width={200}
                                        height={200}
                                        src={`/images/${mainImageId}`}
                                        alt="제품 메인 이미지"
                                        style={{ objectFit: "cover", borderRadius: "12px", border: "1px solid #f0f0f0" }}
                                        fallback="https://via.placeholder.com/200?text=No+Image"
                                    />
                                    <div style={{ marginTop: "12px" }}>
                                        <Space direction="vertical" style={{ width: "100%" }}>
                                            <Button
                                                size="middle"
                                                type="primary"
                                                ghost
                                                block
                                                onClick={() => {
                                                    const input = document.createElement("input");
                                                    input.type = "file";
                                                    input.accept = "image/*";
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) handleImageChange(mainImageId, file);
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                메인 이미지 변경 (파일)
                                            </Button>
                                            <Space.Compact style={{ width: '100%' }}>
                                                <Input
                                                    placeholder="이미지 URL 입력"
                                                    value={imageUrlInput}
                                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                                    onPressEnter={() => handleImageUrlSubmit(mainImageId)}
                                                />
                                                <Button 
                                                    type="primary" 
                                                    onClick={() => handleImageUrlSubmit(mainImageId)}
                                                    loading={isFetchingUrl}
                                                >
                                                    URL로 변경
                                                </Button>
                                            </Space.Compact>
                                        </Space>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: "20px", background: "#fafafa", borderRadius: "8px", textAlign: "center" }}>
                                    <Text type="secondary">메인 이미지가 등록되지 않았습니다.</Text>
                                    <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
                                        <Space direction="vertical" style={{ width: "100%", maxWidth: 300 }}>
                                            <Button
                                                size="small"
                                                type="primary"
                                                block
                                                onClick={() => {
                                                    const input = document.createElement("input");
                                                    input.type = "file";
                                                    input.accept = "image/*";
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) handleImageChange(null, file);
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                이미지 등록 (파일)
                                            </Button>
                                            <Space.Compact style={{ width: '100%' }}>
                                                <Input
                                                    size="small"
                                                    placeholder="이미지 URL 입력"
                                                    value={imageUrlInput}
                                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                                    onPressEnter={() => handleImageUrlSubmit(null)}
                                                />
                                                <Button 
                                                    size="small"
                                                    type="primary" 
                                                    onClick={() => handleImageUrlSubmit(null)}
                                                    loading={isFetchingUrl}
                                                >
                                                    URL로 등록
                                                </Button>
                                            </Space.Compact>
                                        </Space>
                                    </div>
                                </div>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="제품 병합">
                            <Space.Compact style={{ width: '100%' }}>
                                <Input
                                    placeholder="병합할 대상 제품 ID (To ID)"
                                    value={toProductId}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToProductId(e.target.value)}
                                />
                                <Button type="primary" danger onClick={handleMergeClick}>
                                    Merge
                                </Button>
                            </Space.Compact>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                * 주의: 현재 제품의 데이터가 입력한 제품 ID로 병합되며, 현재 제품은 삭제될 수 있습니다.
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#888" }}>
                        데이터가 없습니다.
                    </div>
                )}
            </Modal>

            {/* Merge Confirmation Modal */}
            <Modal
                title="제품 병합 확인"
                open={mergeConfirmVisible}
                onCancel={() => setMergeConfirmVisible(false)}
                onOk={handleFinalMerge}
                confirmLoading={merging}
                okText="최종 병합 실행"
                cancelText="취소"
                okButtonProps={{ danger: true }}
                width={600}
                zIndex={1050}
                destroyOnClose
            >
                <div style={{ marginBottom: '16px' }}>
                    <Text strong>다음 제품으로 병합하시겠습니까?</Text>
                </div>
                {toProductDetail && (
                    <Card size="small" title="대상 제품 정보 (Raw Data)" style={{ background: '#f5f5f5' }}>
                        <pre style={{ margin: 0, fontSize: '11px', maxHeight: '300px', overflow: 'auto' }}>
                            {JSON.stringify(toProductDetail, null, 2)}
                        </pre>
                    </Card>
                )}
                <div style={{ marginTop: '16px' }}>
                    <Text type="danger" strong>
                        ⚠️ 이 작업은 되돌릴 수 없습니다. 병합하시겠습니까?
                    </Text>
                </div>
            </Modal>
        </div>
    );
};
