import { message } from "antd";
import {
    Report,
    DashboardStats,
    UpdateProductRequest,
    Product,
    UpdateReportRequest,
    MergeProductRequest,
    ProductInfo,
    NoteInfo,
    ProductMainImageResponse,
    getErrorMessage
} from "../types/api";
import { API_BASE_URL } from "../constants";

let getAuthToken: (() => Promise<string | null>) | null = null;
let onUnauthorized: (() => void) | null = null;

export const setupApiInterceptor = (
    tokenProvider: () => Promise<string | null>,
    unauthorizedHandler: () => void
) => {
    getAuthToken = tokenProvider;
    onUnauthorized = unauthorizedHandler;
};

/**
 * Helper strictly typed fetch wrapper
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    let headers: HeadersInit = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
    };

    if (getAuthToken) {
        try {
            const token = await getAuthToken();
            if (token) {
                headers = { ...headers, Authorization: `Bearer ${token}` };
            }
        } catch (e) {
            console.error("Failed to get auth token", e);
        }
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            message.error("인증이 만료되었습니다. 다시 로그인해 주세요.");
            if (onUnauthorized) {
                onUnauthorized();
            }
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            try {
                const errorClone = response.clone();
                const json = await errorClone.json();
                if (json && typeof json === 'object' && json.result === false && typeof json.error === "number") {
                    const msg = getErrorMessage(json.error);
                    message.error(msg);
                    throw new Error(msg);
                }
            } catch (e: any) {
                if (e.message && !e.message.includes("is not valid JSON") && e.message !== "Unexpected end of JSON input") {
                    throw e;
                }
            }

            if (response.status === 404) {
                message.error("요청하신 정보를 찾을 수 없습니다. (404)");
            } else {
                message.error(`서버 오류가 발생했습니다. (${response.status})`);
            }
            const errorData = await response.text().catch(() => "Unknown error");
            throw new Error(`API error (${response.status}): ${errorData}`);
        }

        // Some endpoints return null/empty body (e.g., merge/image POST)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const json = await response.json();
            if (json && typeof json === 'object' && json.result === false && typeof json.error === "number") {
                const msg = getErrorMessage(json.error);
                message.error(msg);
                throw new Error(msg);
            }

            // Return the actual data payload if the request was successful
            if (json && typeof json === 'object' && 'data' in json) {
                return json.data;
            }
            return json;
        }
        return null as any;
    } catch (error: any) {
        // Don't double-show message if we already threw one of our handled errors
        if (error.message === "Unauthorized" || error.message?.includes("API error") || getErrorMessage(0).includes(error.message)) {
            throw error;
        }
        
        console.error("API Fetch internal/network error:", error);
        message.error("네트워크 오류가 발생했습니다. 서버 상태를 확인해 주세요.");
        throw error;
    }
}

// GET admin/report
export function getReports(): Promise<Report[]> {
    return apiFetch<Report[]>("/admin/report");
}

// GET admin/dashboard
export function getDashboard(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>("/admin/dashboard");
}

// GET admin/product/main_image
export function getMainImage(productId: string): Promise<ProductMainImageResponse> {
    return apiFetch<ProductMainImageResponse>(`/admin/product/main_image?product_id=${productId}`);
}

// PUT admin/product
export function updateProduct(data: UpdateProductRequest): Promise<Product> {
    return apiFetch<Product>("/admin/product", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

// PUT admin/report
export function updateReport(id: string, reply: string): Promise<Report> {
    return apiFetch<Report>("/admin/report", {
        method: "PUT",
        body: JSON.stringify({ id, reply } as UpdateReportRequest),
    });
}

// POST admin/product/merge
export function mergeProduct(productId: string, toProductId: string): Promise<null> {
    return apiFetch<null>("/admin/product/merge", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, to_product_id: toProductId } as MergeProductRequest),
    });
}

// POST admin/image/url
export function updateImageUrl(imageUrl: string, imageId?: string, productId?: string): Promise<null> {
    const payload: any = { add_image_url: imageUrl };
    if (imageId) payload.image_id = imageId;
    if (productId) payload.product_id = productId;

    return apiFetch<null>("/admin/image/url", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

// POST admin/image
export function updateImage(imageId: string, imageFile: File): Promise<null> {
    const formData = new FormData();
    formData.append("image_id", imageId);
    formData.append("image", imageFile);

    return apiFetch<null>("/admin/image", {
        method: "POST",
        body: formData,
    });
}

// POST /images/
export function uploadImage(file: File, productId?: string, noteId?: string): Promise<string> {
    const formData = new FormData();
    formData.append("id", crypto.randomUUID());
    formData.append("image", file);
    if (productId) formData.append("product_id", productId);
    if (noteId) formData.append("note_id", noteId);

    return apiFetch<string>("/images/", {
        method: "POST",
        body: formData,
    });
}

// GET /users/:id
export function getUserDetail(id: string): Promise<import("../types/api").UserDetailResponse> {
    return apiFetch<import("../types/api").UserDetailResponse>(`/users/${id}`);
}

// GET /products/:id
export function getProductDetail(id: string): Promise<ProductInfo> {
    return apiFetch<ProductInfo>(`/products/${id}`);
}

// GET /products
export function fetchProducts(search: string | null, index: number): Promise<ProductInfo[]> {
    const params = new URLSearchParams({
        page: (index + 1).toString(),
        per: "20", // Assuming C.N.pagingCount is 20
        order_by: "registered"
    });

    if (search) {
        params.append("name", search);
    }

    return apiFetch<ProductInfo[]>(`/products?${params.toString()}`);
}

// GET /admin/product/barcodes
export function getProductBarcodes(productId: string): Promise<string[]> {
    return apiFetch<string[]>(`/admin/product/barcodes?product_id=${productId}`);
}

// GET /admin/notes
export function fetchNotes(index: number, per: number = 20): Promise<NoteInfo[]> {
    const params = new URLSearchParams({
        page: (index + 1).toString(),
        per: per.toString()
    });

    return apiFetch<NoteInfo[]>(`/admin/notes?${params.toString()}`);
}
