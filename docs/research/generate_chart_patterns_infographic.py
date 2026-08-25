"""Create a Korean visual guide for the chart-pattern research report."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"C:/Users/Junsung/Desktop/app-dev/docs/research/assets/v1.0_chart_patterns_visual_guide.png")
W, H = 2400, 1800
BG = "#0B1220"
PANEL = "#111C2E"
GRID = "#24334A"
TEXT = "#E8EEF8"
MUTED = "#A8B6CC"
GREEN = "#36D399"
RED = "#FB7185"
BLUE = "#60A5FA"
YELLOW = "#FBBF24"
PURPLE = "#C084FC"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:/Windows/Fonts/malgunbd.ttf" if bold else r"C:/Windows/Fonts/malgun.ttf",
        r"C:/Windows/Fonts/NanumGothicBold.ttf" if bold else r"C:/Windows/Fonts/NanumGothic.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, color=TEXT, bold=False, anchor=None):
    draw.text(xy, value, font=font(size, bold), fill=color, anchor=anchor)


def rounded(draw: ImageDraw.ImageDraw, box, fill, outline=None, radius=24, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def chart_box(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int):
    for px in range(x, x + w + 1, 100):
        draw.line((px, y, px, y + h), fill=GRID, width=1)
    for py in range(y, y + h + 1, 80):
        draw.line((x, py, x + w, py), fill=GRID, width=1)
    draw.rectangle((x, y, x + w, y + h), outline="#30415C", width=2)


def polyline(draw: ImageDraw.ImageDraw, points, fill, width=8):
    draw.line(points, fill=fill, width=width, joint="curve")
    for p in points:
        draw.ellipse((p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5), fill=fill)


def arrow(draw: ImageDraw.ImageDraw, a, b, fill, width=7):
    draw.line((a, b), fill=fill, width=width)
    draw.polygon([(b[0], b[1]), (b[0] - 18, b[1] - 14), (b[0] - 18, b[1] + 14)], fill=fill)


def badge(draw, x, y, label, color):
    rounded(draw, (x, y, x + 250, y + 56), fill="#172640", outline=color, radius=18, width=2)
    text(draw, (x + 125, y + 29), label, 25, color, True, anchor="mm")


def panel_title(draw, x, y, num, title, subtitle, accent):
    rounded(draw, (x, y, x + 58, y + 58), fill=accent, radius=16)
    text(draw, (x + 29, y + 29), str(num), 30, BG, True, anchor="mm")
    text(draw, (x + 82, y + 2), title, 40, TEXT, True)
    text(draw, (x + 82, y + 51), subtitle, 25, MUTED)


def bullet(draw, x, y, lead, rest, color):
    """Compact one-line annotation sized to remain within each panel."""
    draw.ellipse((x, y + 8, x + 14, y + 22), fill=color)
    text(draw, (x + 28, y), lead, 21, TEXT, True)
    text(draw, (x + 28 + int(len(lead) * 20), y), rest, 21, MUTED)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)

    # Header
    text(draw, (96, 64), "코인 차트 패턴: 검증 가능한 세팅 4가지", 58, TEXT, True)
    text(draw, (98, 139), "우선순위는 ‘승률’이 아니라 진입·무효화·손절을 사전에 정의하고 테스트할 수 있는 정도입니다.", 30, MUTED)
    rounded(draw, (1860, 68, 2280, 136), fill="#172640", outline=BLUE, radius=22, width=2)
    text(draw, (2070, 102), "v1.0 · 교육용 / 투자 조언 아님", 24, BLUE, True, anchor="mm")

    # Panel coordinates
    panels = [(80, 230), (1240, 230), (80, 940), (1240, 940)]
    for x, y in panels:
        rounded(draw, (x, y, x + 1080, y + 620), fill=PANEL, outline="#253756", radius=30, width=3)

    # 1 breakout/retest
    x, y = panels[0]
    panel_title(draw, x + 44, y + 38, 1, "돌파 → 재시험 → 재돌파", "가장 먼저 코드화할 후보", GREEN)
    badge(draw, x + 770, y + 40, "검증가능성: 높음", GREEN)
    cx, cy, cw, ch = x + 50, y + 155, 650, 330
    chart_box(draw, cx, cy, cw, ch)
    resistance = cy + 115
    draw.line((cx + 15, resistance, cx + cw - 15, resistance), fill=BLUE, width=4)
    text(draw, (cx + cw - 12, resistance - 35), "레인지 상단 / 이전 저항", 22, BLUE, anchor="ra")
    pts = [(cx + 40, cy + 255), (cx + 120, cy + 225), (cx + 185, cy + 240), (cx + 260, cy + 205), (cx + 320, cy + 220), (cx + 390, cy + 95), (cx + 455, cy + 125), (cx + 515, cy + 110), (cx + 625, cy + 42)]
    polyline(draw, pts, GREEN)
    draw.ellipse((cx + 440, cy + 110, cx + 470, cy + 140), outline=YELLOW, width=5)
    arrow(draw, (cx + 365, cy + 165), (cx + 390, cy + 100), GREEN)
    text(draw, (cx + 350, cy + 178), "종가 돌파", 22, GREEN)
    text(draw, (cx + 420, cy + 155), "재시험", 22, YELLOW)
    draw.line((cx + 444, cy + 140, cx + 444, cy + 270), fill=RED, width=3)
    text(draw, (cx + 455, cy + 268), "무효화: 재시험 저점 이탈", 20, RED)
    bullet(draw, x + 700, y + 180, "진입", ": 재시험 뒤 경계 밖 종가 유지", GREEN)
    bullet(draw, x + 700, y + 245, "필터", ": 상위 TF 추세·유동성·거래비용", BLUE)
    bullet(draw, x + 700, y + 310, "주의", ": ‘가짜 돌파 감소’는 검증 전 가설", YELLOW)
    bullet(draw, x + 700, y + 375, "손절", ": 재시험의 극값 밖", RED)

    # 2 trend pullback
    x, y = panels[1]
    panel_title(draw, x + 44, y + 38, 2, "추세 내 풀백 지속", "구조가 유지될 때만", BLUE)
    badge(draw, x + 770, y + 40, "검증가능성: 중간", BLUE)
    cx, cy, cw, ch = x + 50, y + 155, 650, 330
    chart_box(draw, cx, cy, cw, ch)
    ma = [(cx + 20, cy + 275), (cx + 160, cy + 235), (cx + 300, cy + 185), (cx + 460, cy + 130), (cx + 630, cy + 85)]
    draw.line(ma, fill=PURPLE, width=6)
    text(draw, (cx + 28, cy + 285), "상위 TF 상승 구조", 22, PURPLE)
    pts = [(cx + 35, cy + 285), (cx + 125, cy + 225), (cx + 220, cy + 245), (cx + 300, cy + 165), (cx + 380, cy + 205), (cx + 440, cy + 150), (cx + 535, cy + 100), (cx + 620, cy + 72)]
    polyline(draw, pts, BLUE)
    draw.ellipse((cx + 360, cy + 185, cx + 400, cy + 225), outline=YELLOW, width=5)
    arrow(draw, (cx + 395, cy + 190), (cx + 445, cy + 148), GREEN)
    text(draw, (cx + 335, cy + 238), "풀백 후 종가 회복", 22, YELLOW)
    draw.line((cx + 380, cy + 225, cx + 380, cy + 300), fill=RED, width=3)
    text(draw, (cx + 390, cy + 296), "무효화: 직전 구조 저점 이탈", 20, RED)
    bullet(draw, x + 700, y + 180, "전제", ": HH/HL 또는 LL/LH가 선행", BLUE)
    bullet(draw, x + 700, y + 245, "진입", ": 평균/레벨 터치 후 방향 종가", GREEN)
    bullet(draw, x + 700, y + 310, "회피", ": 박스권·급변동 직후", RED)
    bullet(draw, x + 700, y + 375, "근거", ": 패턴 자체의 보편 승률 미확인", YELLOW)

    # 3 range mean reversion
    x, y = panels[2]
    panel_title(draw, x + 44, y + 38, 3, "박스권 가장자리 평균회귀", "중간에서는 거래하지 않기", YELLOW)
    badge(draw, x + 770, y + 40, "검증가능성: 중간", YELLOW)
    cx, cy, cw, ch = x + 50, y + 155, 650, 330
    chart_box(draw, cx, cy, cw, ch)
    top, bottom, mid = cy + 80, cy + 265, cy + 172
    draw.line((cx + 15, top, cx + cw - 15, top), fill=RED, width=4)
    draw.line((cx + 15, bottom, cx + cw - 15, bottom), fill=GREEN, width=4)
    draw.line((cx + 15, mid, cx + cw - 15, mid), fill=MUTED, width=2)
    text(draw, (cx + cw - 15, top - 30), "저항", 22, RED, anchor="ra")
    text(draw, (cx + cw - 15, bottom + 9), "지지", 22, GREEN, anchor="ra")
    text(draw, (cx + cw - 15, mid + 8), "중앙: 대기", 20, MUTED, anchor="ra")
    pts = [(cx + 35, cy + 220), (cx + 100, bottom), (cx + 185, cy + 140), (cx + 275, top), (cx + 360, cy + 190), (cx + 450, bottom), (cx + 535, cy + 135), (cx + 620, top)]
    polyline(draw, pts, YELLOW)
    draw.ellipse((cx + 85, bottom - 18, cx + 115, bottom + 12), outline=GREEN, width=5)
    draw.ellipse((cx + 605, top - 12, cx + 635, top + 18), outline=RED, width=5)
    text(draw, (cx + 55, bottom + 35), "지지 반응 후 진입 후보", 20, GREEN)
    bullet(draw, x + 700, y + 180, "전제", ": 경계가 최소 2회 이상 반응", BLUE)
    bullet(draw, x + 700, y + 245, "목표", ": 중앙 또는 반대 경계", GREEN)
    bullet(draw, x + 700, y + 310, "금지", ": 레인지 중앙에서 진입", RED)
    bullet(draw, x + 700, y + 375, "무효화", ": 종가 돌파 + 지속 확인", YELLOW)

    # 4 SFP
    x, y = panels[3]
    panel_title(draw, x + 44, y + 38, 4, "실패 돌파 / SFP", "보조 맥락 · 단독 신호 금지", RED)
    badge(draw, x + 770, y + 40, "검증가능성: 낮음", RED)
    cx, cy, cw, ch = x + 50, y + 155, 650, 330
    chart_box(draw, cx, cy, cw, ch)
    swing = cy + 145
    draw.line((cx + 15, swing, cx + cw - 15, swing), fill=BLUE, width=4)
    text(draw, (cx + cw - 16, swing - 30), "이전 스윙 고점", 22, BLUE, anchor="ra")
    pts = [(cx + 35, cy + 255), (cx + 120, cy + 200), (cx + 220, swing), (cx + 300, cy + 170), (cx + 375, cy + 65), (cx + 395, cy + 165), (cx + 485, cy + 195), (cx + 570, cy + 245), (cx + 630, cy + 265)]
    polyline(draw, pts, RED)
    draw.line((cx + 375, cy + 65, cx + 375, cy + 165), fill=YELLOW, width=8)
    text(draw, (cx + 330, cy + 37), "윅: 스윙 침범", 22, YELLOW)
    draw.ellipse((cx + 380, cy + 150, cx + 410, cy + 180), outline=GREEN, width=5)
    text(draw, (cx + 405, cy + 170), "범위 안 종가 복귀", 20, GREEN)
    bullet(draw, x + 700, y + 180, "관찰", ": 이전 고·저점 침범 후 복귀", YELLOW)
    bullet(draw, x + 700, y + 245, "확인", ": 다음 봉·상위 TF 맥락 필요", BLUE)
    bullet(draw, x + 700, y + 310, "위험", ": 실제 추세 돌파를 스윕으로 오인", RED)
    bullet(draw, x + 700, y + 375, "금지", ": ‘고래 의도’로 원인을 단정", MUTED)

    # footer
    draw.line((80, 1600, 2320, 1600), fill="#253756", width=2)
    text(draw, (96, 1635), "공통 실행 원칙", 30, TEXT, True)
    text(draw, (96, 1693), "① 상위 TF 레짐  ② 종가 기준 확인  ③ 사전 손절·포지션 크기  ④ 수수료·슬리피지·펀딩 포함 OOS 백테스트", 29, MUTED)
    text(draw, (96, 1741), "출처: v1.0_crypto_chart_pattern_research.md  |  ‘패턴 모양’은 신호가 아니라 검증할 가설이다.", 24, "#7F91AD")

    image.save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
