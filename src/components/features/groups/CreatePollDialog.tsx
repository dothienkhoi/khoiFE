"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { createPoll } from "@/lib/customer-api-client";
import { useCustomerStore } from "@/store/customerStore";

interface CreatePollDialogProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: number | null;
}

export function CreatePollDialog({ isOpen, onClose, conversationId }: CreatePollDialogProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]); // Ít nhất 2 lựa chọn
    const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
    const [closesAt, setClosesAt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addOption = () => {
        if (options.length < 10) { // Giới hạn tối đa 10 lựa chọn
            setOptions([...options, ""]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) { // Phải có ít nhất 2 lựa chọn
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async () => {
        // Validation
        if (!question.trim()) {
            toast.error("Vui lòng nhập câu hỏi");
            return;
        }

        const validOptions = options.filter(option => option.trim() !== "");
        if (validOptions.length < 2) {
            toast.error("Cần ít nhất 2 lựa chọn");
            return;
        }

        if (!closesAt) {
            toast.error("Vui lòng chọn thời gian kết thúc");
            return;
        }

        const closesAtDate = new Date(closesAt);
        if (closesAtDate <= new Date()) {
            toast.error("Thời gian kết thúc phải trong tương lai");
            return;
        }

        setIsSubmitting(true);

        try {
            if (conversationId == null) {
                toast.error("Không có conversation để tạo bình chọn");
                return;
            }
            const response = await createPoll(conversationId, {
                question: question.trim(),
                options: validOptions,
                closesAt: closesAtDate.toISOString(),
                allowMultipleChoices
            });

            if (response.success) {
                toast.success("Tạo cuộc bình chọn thành công!");



                // Add poll message to store
                const pollMessage = response.data.pollMessage;
                useCustomerStore.getState().addMessage(conversationId, pollMessage);

                // Reset form
                setQuestion("");
                setOptions(["", ""]);
                setAllowMultipleChoices(false);
                setClosesAt("");

                onClose();
            } else {
                toast.error(response.message || "Không thể tạo cuộc bình chọn");
            }
        } catch (error: any) {
            console.error("Create poll error:", error);
            if (error.response?.status === 403) {
                toast.error("Bạn không có quyền tạo cuộc bình chọn trong nhóm này");
            } else if (error.response?.status === 400) {
                toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại");
            } else {
                toast.error("Có lỗi xảy ra khi tạo cuộc bình chọn");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setQuestion("");
            setOptions(["", ""]);
            setAllowMultipleChoices(false);
            setClosesAt("");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tạo cuộc bình chọn</DialogTitle>
                    <DialogDescription>
                        Tạo một cuộc bình chọn mới để thu thập ý kiến từ thành viên trong nhóm.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Question */}
                    <div className="space-y-2">
                        <Label htmlFor="question">Câu hỏi *</Label>
                        <Textarea
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Nhập câu hỏi bình chọn..."
                            rows={3}
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">
                            {question.length}/500 ký tự
                        </p>
                    </div>

                    <Separator />

                    {/* Options */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Lựa chọn *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                disabled={options.length >= 10}
                                className="h-8 px-3"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Thêm lựa chọn
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => updateOption(index, e.target.value)}
                                        placeholder={`Lựa chọn ${index + 1}`}
                                        maxLength={200}
                                    />
                                    {options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOption(index)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Cần ít nhất 2 lựa chọn, tối đa 10 lựa chọn
                        </p>
                    </div>

                    <Separator />

                    {/* Settings */}
                    <div className="space-y-4">
                        {/* Multiple choices */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="multiple-choices">Cho phép chọn nhiều</Label>
                                <p className="text-xs text-muted-foreground">
                                    Người dùng có thể chọn nhiều lựa chọn
                                </p>
                            </div>
                            <Switch
                                id="multiple-choices"
                                checked={allowMultipleChoices}
                                onCheckedChange={setAllowMultipleChoices}
                            />
                        </div>

                        {/* Closing time */}
                        <div className="space-y-2">
                            <Label htmlFor="closesAt">Thời gian kết thúc *</Label>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="closesAt"
                                    type="datetime-local"
                                    value={closesAt}
                                    onChange={(e) => setClosesAt(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Cuộc bình chọn sẽ tự động kết thúc vào thời gian này
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !question.trim() || options.filter(o => o.trim()).length < 2 || !closesAt}
                        >
                            {isSubmitting ? "Đang tạo..." : "Tạo cuộc bình chọn"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
