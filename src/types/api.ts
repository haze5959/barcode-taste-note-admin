// src/types/api.ts

export interface Product {
    id: string; // Uuid
    name: string; // Text
    type: number; // Int2
    desc: string | null; // Nullable<Text>
    rating: number | null; // Nullable<Float4>
    flavor_infos: Record<string, any> | null; // Nullable<Jsonb>
    registered: string; // Timestamptz
    note_count: number; // Int4
}

export interface Report {
    id: string; // Uuid
    product_id: string; // Uuid
    user_id: string; // Uuid
    body: string;
    state: number;
    reply: string;
    type: number;
    registered: string; // Date/Timestamptz string
}

export interface DashboardStats {
    registered_user_count: number;
    monthly_registered_user_count: number;
    product_count: number;
    monthly_note_count: number;
    daily_note_count: number;
    not_reply_report_count: number;
}

export interface ProductMainImageResponse {
    image_id: string | null;
}

// Requests
export interface UpdateProductRequest {
    product_id: string; // Uuid
    name?: string; // Optional
    desc?: string; // Optional
    type?: number; // Optional
}

export interface UpdateReportRequest {
    id: string; // Uuid
    reply: string;
}

export interface MergeProductRequest {
    product_id: string; // Uuid
    to_product_id: string; // Uuid
}

export enum PublicScope {
    Private = 0,
    FriendsOnly = 1,
    Public = 2
}

export interface Flavor {
    id: string; // Uuid
    name: string;
}

export interface User {
    id: string; // Uuid
    nick_name: string;
    intro: string | null;
    image_id: string | null;
}

export interface UserDetailResponse {
    user: User;
    note_count: number;
    follower_count: number;
}

export interface ProductInfo {
    id: string; // Uuid
    product: Product;
    image_ids: string[] | null; // [UUID]
    favorite_count: number | null; // Int?
}

export interface Note {
    id: string; // Uuid
    body: string;
    rating: number; // Int
    registered: string; // Date
    public_scope: PublicScope;
    details: Record<string, number> | null; // [String: Int]?
}

export interface NoteInfo {
    id: string; // Uuid
    note: Note;
    product: Product;
    image_ids: string[] | null; // [UUID]?
    product_image_id: string | null; // UUID?
    flavors: Flavor[] | null;
    user: User | null;
}

export enum CommonResponseError {
    InternalServerError = 100,
    InternalDBError = 101,
    AuthValidationFail = 102,
    DuplicatedError = 103,
    JWKSFetchError = 104,
    RecordNotFound = 105,
    InvalidParameter = 106,
    ExceedMaxCount = 107,
    FailedToAnalyzeImage = 108,
    Unknown = 255
}

export function getErrorMessage(code: number): string {
    switch (code) {
        case CommonResponseError.InternalServerError:
            return "서버 내부 오류가 발생했습니다. (100)";
        case CommonResponseError.InternalDBError:
            return "데이터베이스 오류가 발생했습니다. (101)";
        case CommonResponseError.AuthValidationFail:
            return "권한 검증에 실패했습니다. (102)";
        case CommonResponseError.DuplicatedError:
            return "중복된 데이터가 이미 존재합니다. (103)";
        case CommonResponseError.JWKSFetchError:
            return "인증 서버(JWKS) 통신에 실패했습니다. (104)";
        case CommonResponseError.RecordNotFound:
            return "요청하신 데이터를 찾을 수 없습니다. (105)";
        case CommonResponseError.InvalidParameter:
            return "잘못된 요청 파라미터입니다. (106)";
        case CommonResponseError.ExceedMaxCount:
            return "허용된 최대 개수를 초과했습니다. (107)";
        case CommonResponseError.FailedToAnalyzeImage:
            return "이미지 분석에 실패했습니다. (108)";
        default:
            return `알 수 없는 오류가 발생했습니다. (Error Code: ${code})`;
    }
}
