"use client"

import type React from "react"

import { useEffect, useState } from "react"
import AOS from "aos"
import "aos/dist/aos.css"
import { Button } from "@/components/ui/button"
import { MessageCircle, Video, Users, Globe } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthStore } from "@/store/authStore"

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [index, setIndex] = useState(0)
  const [isHover, setIsHover] = useState(false)
  const [isPlaying] = useState(true)

  const go = (i: number) => setIndex((prev) => (i + images.length) % images.length)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
    // Init AOS
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true })
    AOS.refresh()

    // Đảm bảo body có thể cuộn
    document.body.style.overflow = "auto"
    document.body.style.height = "auto"

    // Header scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      document.body.style.overflow = ""
      document.body.style.height = ""
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (isHover || !isPlaying) return
    const id = setInterval(() => go(index + 1), 3500)
    return () => clearInterval(id)
  }, [index, isHover, isPlaying])

  const handleGetStarted = () => {
    router.push("/register")
  }

  const handleDemo = () => {
    setIsDemoOpen(true)
  }

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const email = formData.get("email") as string
    if (email) {
      alert(`Cảm ơn bạn đã đăng ký! Chúng tôi sẽ gửi thông tin khuyến mãi đến ${email}`)
        ; (e.currentTarget as HTMLFormElement).reset()
    }
  }

  const images = [
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop&crop=center",
  ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 relative overflow-y-auto scroll-smooth font-sans antialiased transition-all duration-500 pt-24">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-indigo-500/20 dark:from-blue-400/10 dark:via-purple-400/8 dark:to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/20 via-blue-500/15 to-cyan-500/20 dark:from-purple-400/10 dark:via-blue-400/8 dark:to-cyan-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-pink-500/15 dark:from-indigo-400/8 dark:via-purple-400/5 dark:to-pink-400/8 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <header
          className={`fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between p-6 transition-all duration-300 ease-in-out ${isScrolled
            ? "backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/80 dark:border-gray-700/80 shadow-2xl"
            : "backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/60 dark:border-gray-700/60 shadow-lg"
            }`}
          data-aos="fade-down"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div
              className={`${isScrolled ? "w-8 h-8" : "w-10 h-10"} bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}
            >
              <MessageCircle
                className={`${isScrolled ? "w-5 h-5" : "w-6 h-6"} text-white transition-all duration-300`}
              />
            </div>
            <span
              className={`${isScrolled ? "text-xl" : "text-2xl"} font-bold transition-all duration-300 font-sans leading-tight`}
            >
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                FastBite
              </span>
              <span className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                Group
              </span>
            </span>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Link href="/login">
              <Button
                variant="outline"
                className="px-6 py-2 border-2 border-blue-500/50 dark:border-blue-400/50 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500/10 dark:hover:bg-blue-400/10 hover:border-blue-600 dark:hover:border-blue-400 transition-all duration-300 backdrop-blur-sm bg-transparent font-medium"
              >
                Đăng nhập
              </Button>
            </Link>
            <Link href="/register">
              <Button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25 font-medium">
                Đăng ký
              </Button>
            </Link>
          </div>
        </header>

        <section className="relative z-10 py-20 lg:py-28 px-6 lg:px-8" data-aos="fade-up">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 lg:gap-24 items-center">
              {/* Left Content */}
              <div className="space-y-10 pr-8 lg:pr-16" data-aos="fade-right">
                <div className="inline-block">
                  <span className="text-sm lg:text-base text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 px-6 py-3 rounded-full border border-blue-500/20 dark:border-blue-400/20 backdrop-blur-sm font-sans font-medium">
                    Theo dõi nhắn tin chia sẻ thông tin với nhóm
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-tight tracking-tight font-sans">
                  <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 dark:from-blue-400 dark:via-blue-500 dark:to-purple-400 bg-clip-text text-transparent">
                    FastBite
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 dark:from-purple-400 dark:via-purple-500 dark:to-blue-400 bg-clip-text text-transparent">
                    Group
                  </span>
                </h1>

                <h2 className="mt-6 text-3xl lg:text-5xl font-bold text-gray-700 dark:text-gray-200 font-sans leading-tight">
                  Kết nối • Chia sẻ • Cộng tác
                </h2>

                <p className="mt-6 text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl font-sans">
                  Nền tảng giúp bạn chia sẻ thông tin trong nhóm, làm việc hiệu quả và luôn cập nhật.
                </p>
              </div>

              <div className="relative select-none pl-4 lg:pl-8" data-aos="fade-left">
                <div
                  className="w-full max-w-lg mx-auto h-[26rem] sm:h-[30rem] lg:h-[34rem] cursor-pointer relative"
                  onMouseEnter={() => setIsHover(true)}
                  onMouseLeave={() => setIsHover(false)}
                  onClick={() => go(index + 1)}
                >
                  {/* Image Container */}
                  <div className="relative w-full h-full">
                    <div
                      className="w-full h-full transition-all duration-700 ease-in-out transform rounded-3xl shadow-2xl"
                      style={{
                        transform: `scale(${isHover ? 1.02 : 1})`,
                      }}
                    >
                      <img
                        src={images[index] || "/placeholder.svg"}
                        alt={`Team collaboration slide ${index + 1}`}
                        className="w-full h-full object-cover rounded-3xl transition-all duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-3xl"></div>
                    </div>
                  </div>
                  {/* Dots */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          go(i)
                        }}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i === index ? "bg-white scale-125 shadow-lg shadow-white/50" : "bg-white/60 hover:bg-white/80"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 bg-clip-text text-transparent mb-6 font-sans leading-tight">
                Xem Hoạt Động Thực Tế
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative group cursor-pointer" data-aos="zoom-in" data-aos-delay="100">
                <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-400/10 dark:to-purple-400/10 rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl group-hover:shadow-blue-500/20 dark:group-hover:shadow-blue-400/20 transition-all duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center"
                    alt="Giao diện tin nhắn"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-2 font-sans">Tin Nhắn</h3>
                      <p className="text-sm opacity-90 font-sans">Giao diện tin nhắn sạch sẽ, nhanh chóng</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer" data-aos="zoom-in" data-aos-delay="200">
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-indigo-500/20 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl group-hover:shadow-purple-500/20 dark:group-hover:shadow-purple-400/20 transition-all duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&crop=center"
                    alt="Bảng tin nhóm"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-2 font-sans">Bảng Tin Nhóm</h3>
                      <p className="text-sm opacity-90 font-sans">Chia sẻ cập nhật và thông báo</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer" data-aos="zoom-in" data-aos-delay="300">
                <div className="aspect-video bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-400/10 dark:to-teal-400/10 rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl group-hover:shadow-green-500/20 dark:group-hover:shadow-green-400/20 transition-all duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop&crop=center"
                    alt="Cuộc gọi video"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-2 font-sans">Cuộc Gọi Video</h3>
                      <p className="text-sm opacity-90 font-sans">Cuộc gọi video HD với chia sẻ màn hình</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== GROUP ACTIVITY SECTION ===== */}
        <section
          className="relative z-10 py-20 px-6 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm transition-colors duration-300"
          data-aos="fade-up"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div className="space-y-6">
                <div className="inline-block">
                  <div className="flex items-center gap-2 bg-cyan-500/10 dark:bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-500/20 dark:border-cyan-400/20 backdrop-blur-sm">
                    <MessageCircle className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    <span className="text-sm text-cyan-600 dark:text-cyan-400 font-medium font-sans">
                      NHÓM CHAT & BÀI ĐĂNG
                    </span>
                  </div>
                </div>

                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight font-sans">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 bg-clip-text text-transparent">
                    Hoạt động nhóm
                    <br />
                    Bảng tin & Chat
                  </span>
                </h2>

                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  Nhận thông báo khi có bài đăng mới, bình luận, lượt thích hoặc khi bạn được nhắc tên trong cuộc trò
                  chuyện của nhóm.
                </p>
              </div>

              {/* Right - Device Mockup */}
              <div className="relative">
                <div className="animate-bounce">
                  <div className="w-80 h-96 mx-auto bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 shadow-2xl">
                    <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 space-y-4">
                      {/* Chat mention */}
                      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10 rounded-lg p-4 border border-cyan-500/30 dark:border-cyan-400/30">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-sans">Nhóm: DevTeam</div>
                        <div className="text-gray-800 dark:text-gray-100 font-semibold font-sans">
                          @Quan được nhắc trong #general
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">3 phút trước</div>
                      </div>

                      {/* New post preview */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-lg p-4 border border-purple-500/30 dark:border-purple-400/30">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-sans">
                          Bài đăng mới • Nhóm Phát triển phần mềm
                        </div>
                        <div className="text-gray-800 dark:text-gray-100 font-medium font-sans">
                          Kế hoạch ra mắt tính năng tuần này
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 font-sans">
                          <span>12 bình luận</span>
                          <span>•</span>
                          <span>37 lượt thích</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== THEME / BRANDING SECTION ===== */}
        <section className="relative z-10 py-20 px-6" data-aos="fade-up">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-16">
              <div className="inline-block mb-6">
                <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 backdrop-blur-sm">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-indigo-400 font-medium font-sans">TÙY BIẾN GIAO DIỆN</span>
                </div>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6 font-sans">
                <span className="bg-gradient-to-r from-[#6a11cb] via-[#6a11cb] to-[#2575fc] bg-clip-text text-transparent">
                  Không gian nhóm linh hoạt
                </span>
              </h2>

              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto font-sans">
                Đồng bộ thương hiệu của bạn cho tất cả phòng chat và bảng tin. Hỗ trợ Dark/Light mode, màu chủ đề nhóm,
                hình nền, avatar và nhãn vai trò thành viên.
              </p>
            </div>

            {/* Device Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-4xl mx-auto">
              {/* Theme: Purple */}
              <div className="animate-bounce">
                <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 shadow-2xl">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-sm font-semibold">Chủ đề</div>
                      <div className="text-xl font-bold">Tím</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme: Light */}
              <div className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-white rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 shadow-2xl">
                  <div className="h-full bg-white rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-800 rounded-full mx-auto mb-1"></div>
                      <div className="text-gray-800 text-sm font-semibold">Chế độ sáng</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme: Teal */}
              <div className="animate-bounce" style={{ animationDelay: "0.4s" }}>
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 shadow-2xl">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-sm">Chủ đề</div>
                      <div className="text-2xl font-bold">Xanh</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget: Thông báo nhóm */}
              <div className="animate-bounce" style={{ animationDelay: "0.6s" }}>
                <div className="w-full h-48 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 shadow-2xl">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-sm">Thông báo</div>
                      <div className="text-xl font-bold">Nhắc @tên</div>
                      <div className="text-xs mt-1 text-blue-300">Tin nhắn mới trong #general</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme: Dark */}
              <div className="animate-bounce" style={{ animationDelay: "0.8s" }}>
                <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-black rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 shadow-2xl">
                  <div className="h-full bg-gray-200 dark:bg-black rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-800 dark:text-white/80">
                      <div className="w-8 h-8 bg-gray-600 dark:bg-white/20 rounded-full mx-auto mb-1"></div>
                      <div className="text-sm">Chế độ tối</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ===== FEATURES SECTION ===== */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 bg-clip-text text-transparent mb-6 font-sans leading-tight">
                Tính Năng Mạnh Mẽ
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Private Messaging */}
              <div
                className="backdrop-blur-16 bg-white/90 dark:bg-gray-800/20 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-8 transition-all duration-500 hover:bg-gray-50/90 dark:hover:bg-gray-700/30 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transform hover:scale-105 hover:-translate-y-2 group"
                data-aos="fade-right"
                data-aos-delay="100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/20 dark:group-hover:shadow-blue-400/20 transition-all duration-300">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400 font-sans">Tin Nhắn Riêng Tư</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  Trò chuyện một-một an toàn với mã hóa đầu cuối và gửi tin nhắn thời gian thực.
                </p>
              </div>

              {/* Group Chats */}
              <div
                className="backdrop-blur-16 bg-white/90 dark:bg-gray-800/20 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-8 transition-all duration-500 hover:bg-gray-50/90 dark:hover:bg-gray-700/30 hover:border-purple-500/50 dark:hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 transform hover:scale-105 hover:-translate-y-2 group"
                data-aos="fade-right"
                data-aos-delay="200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/20 dark:group-hover:shadow-purple-400/20 transition-all duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-purple-600 dark:text-purple-400 font-sans">Nhóm Chat</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  Tạo và quản lý cuộc trò chuyện nhóm và công cụ kiểm duyệt.
                </p>
              </div>

              {/* Video Calls */}
              <div
                className="backdrop-blur-16 bg-white/90 dark:bg-gray-800/20 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-8 transition-all duration-500 hover:bg-gray-50/90 dark:hover:bg-gray-700/30 hover:border-green-500/50 dark:hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-500/10 dark:hover:shadow-green-400/10 transform hover:scale-105 hover:-translate-y-2 group"
                data-aos="fade-right"
                data-aos-delay="300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:shadow-green-500/20 dark:group-hover:shadow-green-400/20 transition-all duration-300">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400 font-sans">Cuộc Gọi Video</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  Cuộc gọi video chất lượng cao với chia sẻ màn hình.
                </p>
              </div>

              {/* Group Posts */}
              <div
                className="backdrop-blur-16 bg-white/90 dark:bg-gray-800/20 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-8 transition-all duration-500 hover:bg-gray-50/90 dark:hover:bg-gray-700/30 hover:border-orange-500/50 dark:hover:border-orange-400/50 hover:shadow-2xl hover:shadow-orange-500/10 dark:hover:shadow-orange-400/10 transform hover:scale-105 hover:-translate-y-2 group"
                data-aos="fade-right"
                data-aos-delay="400"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:shadow-orange-500/20 dark:group-hover:shadow-orange-400/20 transition-all duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-orange-600 dark:text-orange-400 font-sans">Bài Đăng Nhóm</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  Chia sẻ thông báo, cập nhật và nội dung trong nhóm của bạn như một bảng tin xã hội riêng tư.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/5 dark:to-purple-400/5 rounded-3xl blur-3xl"></div>
              <div className="relative backdrop-blur-16 bg-white/95 dark:bg-gray-800/20 border border-gray-200/60 dark:border-gray-700/40 rounded-3xl p-12 text-center">
                <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 bg-clip-text text-transparent font-sans leading-tight">
                  Sẵn sàng bắt đầu?
                </h2>
                <p className="text-xl mb-12 text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  Tham gia cùng đội nhóm đang sử dụng FastBite Group để làm việc hiệu quả hơn
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg shadow-2xl hover:shadow-3xl hover:shadow-blue-500/30 dark:hover:shadow-blue-400/30 transition-all duration-500 transform hover:scale-110 hover:-translate-y-3 font-semibold rounded-xl"
                    onClick={handleGetStarted}
                  >
                    <Users className="inline-block w-5 h-5 mr-2" />
                    Tạo tài khoản miễn phí
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-purple-500/50 dark:border-purple-400/50 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 dark:hover:bg-purple-400/10 hover:border-purple-600 dark:hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-12 py-6 text-lg backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-400/20 transition-all duration-300 transform hover:scale-105 font-semibold rounded-xl bg-transparent"
                    onClick={handleDemo}
                  >
                    <Video className="inline-block w-5 h-5 mr-2" />
                    Xem demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-gray-200/60 dark:border-gray-700/40 backdrop-blur-sm bg-white/90 dark:bg-gray-900/80 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-16">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 bg-clip-text text-transparent font-sans">
                    FastBite Group
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-sans">
                  Nền tảng giao tiếp thông minh giúp kết nối, chia sẻ và cộng tác hiệu quả hơn.
                </p>
                <div className="flex space-x-4">
                </div>
              </div>

              {/* Product Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-sans">Sản Phẩm</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Tin Nhắn Riêng Tư
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Nhóm Chat
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Cuộc Gọi Video
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Bài Đăng Nhóm
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Chia Sẻ Tệp
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-sans">Thành Viên</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Lê Hoàng Lân
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Nguyễn Khánh Duy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Đỗ Thiện Khôi
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Phùng Thái Sơn
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      Lê Đăng Quang
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support & Newsletter */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-sans">Hỗ Trợ</h3>
                <ul className="space-y-3 mb-6">
                  <li>
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=teamduansd49@gmail.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-sans"
                    >
                      teamduansd49@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            {/* Bottom Footer */}
            <div className="pt-8 border-t border-gray-200/60 dark:border-gray-700/40">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-gray-600 dark:text-gray-400 text-center md:text-left">
                  <p className="font-sans">&copy; 2024 FastBite Group. Tất cả quyền được bảo lưu.</p>
                  <p className="text-sm mt-1 font-sans">Kết Nối. Chia Sẻ. Cộng Tác .</p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      {/* Demo Video Modal */}
      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100 font-sans">Demo FastBite Group</DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-video rounded-md overflow-hidden">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Demo FastBite Group"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
