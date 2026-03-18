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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
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
            // Re-throw if it's our newly thrown error (not a JSON parse fallback exception)
            if (e.message && e.message !== "Unexpected end of JSON input" && !e.message.includes("is not valid JSON")) {
                throw e;
            }
        }

        const errorData = await response.text().catch(() => "Unknown error");
        message.error(`서버 오류가 발생했습니다. (${response.status})`);
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

// GET /admin/notes
export function fetchNotes(index: number, per: number = 20): Promise<NoteInfo[]> {
    const params = new URLSearchParams({
        page: (index + 1).toString(),
        per: per.toString()
    });

    return apiFetch<NoteInfo[]>(`/admin/notes?${params.toString()}`);
}
