import { z } from 'zod'

export const checkinSchema = z.object({
    full_name: z.string()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(100, 'Họ tên không được quá 100 ký tự')
        .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ tên chỉ được chứa chữ cái và khoảng trắng'),

    phone_number: z.string()
        .regex(/^0[0-9]{9}$/, 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0'),

    terms_accepted: z.boolean()
        .refine(val => val === true, 'Bạn phải đồng ý với điều khoản để tiếp tục')
})

export type CheckinFormData = z.infer<typeof checkinSchema>