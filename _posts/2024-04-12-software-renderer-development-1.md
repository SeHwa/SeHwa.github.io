---
layout: post
category: [etc]
title:  "3D 소프트웨어 렌더러 테스트 (1)"
date:   2024-04-12
author: SeHwa
og_image: assets/img/posts/13/cover.jpg
mathjax: true
---

비록 지금은 다른 분야에서 일을 하고 있지만 어릴 때부터 나는 게임 개발을 좋아했고 지금도 마찬가지인데, 특히 3D 그래픽에 대한 꿈 같은 게 있었다. 중학생 때는 3D 그래픽을 그려보려고 뭔가 코딩을 하다가 우연히 코드가 꼬여서 아래와 같은 희한한 걸 만든 적도 있었다.

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/1.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

<br>

그리고 이걸 업로드하면서 아래처럼 글을 쓴 적이 있었다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/13/1.jpg" data-lity>
  <img src="/assets/img/posts/13/1.jpg" style="width:500px" />
</a>
</div>

당시에는 뭔가 3D 그래픽에 대한 환상이 있기도 했다. 물론 이후 진로를 다른 분야로 바꾸면서 따로 관련 공부를 하지는 않았고 컴퓨터 그래픽스 수업도 듣지 않았다.

그 때부터 거의 18년 가까이 지났는데, 취미로라도 중간에 한 번쯤은 해볼만도 했지만 어쩌다보니 전혀 신경을 쓰지 않았고 지금까지 그냥 잊고 있었다. 그러다가 며칠 전에 잠깐 쉬면서 어쩌다가 저 글을 다시 보고 생각이 나서, 한 번 지금이나마 해보기로 했다. 그리 시간을 많이 들일 생각은 없어서 좀 하다가 안 되면 그냥 접기로 했다. 다행히 당일에 이 글에서 설명하는 부분까지는 구현할 수 있었다.

옛날부터 3D 쪽은 언젠가 내가 직접 생각해서 구현을 해보려고, 일부러라도 관련 수식이나 연산 등을 보지 않았다. 그래서 3D 구현 원리를 전혀 모르는 상태인데, 이번에 이걸 만들고 나면 이제 취미 삼아서 틈틈이 공부를 해볼까 한다. 물론 이번에 만드는 건 실제로 쓸 수는 없을테니 실상 별 의미는 없다.

<br>

## Design

우선 막상 처음부터 하려니 어떻게 해야할지 잘 감이 오지 않았다. 그래서 일단 처음부터 3차원 좌표에서의 모든 움직임을 구현할 생각을 하지 말고, 우선 작은 것부터 생각을 해보기로 했다.

일단 문제를 좀 간단하게 만들기 위해, 회전을 모든 방향으로의 회전이 아니라 좌우 회전만 생각하기로 했다. 즉 아래와 같은 회전이다.

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/2.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

그리고 딱히 이유는 없지만 편의상 모니터를 기준으로 가로를 x축으로 생각하고, y축을 깊이? 로 생각하고 z축을 세로로 생각하기로 했다. 또한 공간의 좌표 범위도 편의상 -1.0 ~ 1.0 로 가정해봤다.

이 상황에서, 일단 점 (1, 0, 0) 이 공간에 있다고 가정하고 회전을 하면 점의 위치가 어떻게 변할지를 생각해보면 중심 축(z축)을 기준으로 빙빙 돌것이고, 이걸 정면에서 볼때는 점 하나가 그냥 좌우로 왔다갔다 하는 것처럼 보일 것이다.

그리고 점 (0, 1, 0) 이 똑같이 회전하는 걸 잘 생각해보면, 90도 회전하면 점의 위치가 (1, 0, 0) 가 될 것이다. 저 좌우 회전의 경우 xy 만 변하고 z는 중심축이 되서 전혀 변하지 않을 것이다.

여기서 이제 생각을 하다가, 떠올린 것은 점이 어떤 좌표에 있든 간에 z축을 기준으로 하는 회전을 시키면 그 자취는 당연히 z축을 중심으로 하는 원을 그리게 될 것이다. 그리고 이 원의 반지름은 해당 점의 xy 좌표값으로 피타고라스 정리로 구하는 길이가 될 것을 알 수 있다.

이를 바탕으로, 어떤 점에 대해 n도 회전을 하려고 할 때의 과정을 고안해보았다.

1. 점의 xy 좌표를 기반으로, 해당 점이 지나는 원의 방정식을 구한다.
2. 이 원 내에서 해당 점이 어떤 각에 위치하는지 각을 구한다.
3. 해당 각에 회전할 만큼의 각을 더하거나 뺀다.
4. 이 각을 다시 원의 방정식에 넣어서 새로운 xy 좌표를 얻는다.

대략 이런 과정으로 회전을 구현할 수 있을 것이라 생각했다.

우선 각 값을 기반으로 하는 원이라고 하면, 가장 먼저 떠오른 게 복소평면에서 원을 그리는 오일러 공식이다.  

$$\begin{align}
e^{iθ}=cosθ+isinθ
\end{align}$$

실수부를 x축으로 하고 허수부를 y축으로 하면 위 식은 중심을 기준으로 원을 그리는 걸로 잘 알려져 있는데, 즉 x좌표를 cosθ 로 생각하고 y좌표를 sinθ 로 하면 원이 된다는 것이다. (나중에 생각해보니 이런 식으로 생각할 필요 없고 그냥 극좌표계에서 원을 생각하면 되는데 쓸데없이 이상하게 생각했다)

원의 크기를 나타내는 건 단순히 각 좌표값에 크기를 곱하면 된다. 가령 점 (2, 0, 0) 은 크기가 2 이므로, 이 점은 (2cosθ, 2sinθ) 라는 원 위에 존재한다고 볼 수 있다.

그러면 이제 이걸 바탕으로 실제로 연산 과정을 만들어보기로 했다. 우선 예시로 점 (-1, 0, 0) 을 가정해서 실제로 회전 연산을 생각해보았다. 

1. 점의 xy 좌표를 기반으로, 해당 점이 지나는 원의 방정식을 구한다.
- 점 (-1, 0, 0) 은 크기가 1 이다. 그래서 이 점이 위치하는 원은 단순히 ($cosθ$, $sinθ$) 이다.
2. 이 원 내에서 해당 점이 어떤 각에 위치하는지 각을 구한다.
- 원 ($cosθ$, $sinθ$) 에서 점 (-1, 0, 0) 의 각을 구한다는 것은 즉 $cosθ = -1$, $sinθ = 0$ 이 되는 θ 를 구해야 한다는 것이다. 일단 단순하게 역삼각함수로 $acos(-1) = θ$ 로 각을 얻을 수 있다. 다만 삼각함수의 특성상 역삼각함수는 정의역이 제한되기 때문에, $acos$ 로 구한 각은 180도를 기준으로 동일한 값이 반복되어 중복된다. 따라서 y좌표가 양수인지 음수인지에 따라 얻은 라디안 각에 -를 취해주면 360도 전체를 정상적으로 얻을 수 있다. 일단 여기서는 y좌표값이 0 이므로, 그냥 $acos(-1)$ 해서 얻는 $π$ 이 그대로 각이 된다. 즉 현재 점 위치의 각은 180도가 된다. 물론 이 작업은 전부 원의 크기가 1인 것으로 정규화한 다음 해야하므로 점의 xy축 기준 크기로 나눠주고 나서 하면 된다.
3. 해당 각에 회전할 만큼의 각을 더하거나 뺀다.
- 현재 각이 $π$(180도)이고, 여기서 1도를 회전한다고 하면 181도가 되어야 한다. 즉 새 각 값은 $181×\frac{π}{180}$ 이 된다.
4. 이 각을 다시 원의 방정식에 넣어서 새로운 xy 좌표를 얻는다.
- 최종적으로 새 각을 다시 방정식에 넣으면 새 좌표는 ($cos(181×\frac{π}{180}), sin(181×\frac{π}{180})$) 가 된다. 여기서 위의 2번에서 크기가 1인 원으로 정규화했었으므로 여기서는 반대로 크기를 각 좌표에 곱해주면 된다.

생각보다 연산 자체는 간단하게 만들어졌다. 일단 회전은 대강 이렇게 하면 될 것 같다.

그리고 이제 이 3차원 좌표를 화면에 출력해야 하는데, 즉 3차원 좌표를 2차원 좌표로 변환해야 한다. 다시 머릿 속으로 생각해보면, 위의 좌우 회전을 정면에서 보는 상황일 때 물론 점의 x좌표는 계속 좌우로 왔다갔다 하며 변할 것이고, y축은 아예 무시되서 y좌표가 얼마든 똑같이 보일 것이다. z좌표는 그냥 그대로 세로값이 될 것이다.

결과적으로 단순히 3차원 좌표에서 x좌표와 z좌표만 사용한 (x, z) 가 화면에서의 2차원 좌표가 될 것이다. 그리고 나중에 깨달은 사실이지만 이건 꼭 (x, z) 일 필요도 없고, 그냥 물체를 바라보는 위치를 설정하는 느낌이라 (x, y) 나 (y, z) 로 해도 상관은 없었다.

그리고 이 좌표는 -1.0 ~ 1.0 범위의 좌표이므로, 실제 화면의 픽셀 좌표로 변환하기 위해 단순히 창의 중앙에서부터 좌표에 적당한 값을 곱해서 픽셀 좌표를 얻기로 했다. 대략 이렇게 해서 구현한 코드는 아래와 같다. 

```python
import sys
import math
from PyQt5.QtWidgets import QWidget, QApplication
from PyQt5.QtGui import QPainter, QPen
from PyQt5.QtCore import Qt
from PyQt5 import QtCore

class ThreeD:
    def __init__(self, points):
        self.points = points

    def rotation(self, angle):
        points_rot = []
        for i, (x, y, z) in enumerate(self.points):
            length = math.sqrt(pow(x, 2) + pow(y, 2))
            xa = math.acos(x / length)
            if y < 0: xa = -xa
            new_angle = xa + (angle * math.pi / 180)
            x = math.cos(new_angle) * length
            y = math.sin(new_angle) * length
            points_rot.append( (x, y, z) )
        return points_rot

    def projection(self, points):
        points_2d = []
        for x, y, z in points:
            points_2d.append( (x, z) )
        return points_2d

class MyApp(QWidget):
    def __init__(self):
        super().__init__()
        self.threed = ThreeD([(-1.0, -0.5, 0.0), (0.5, -0.5, 0.0),
                              (-0.5, 0.5, 0.3), (1.0, 0.5, 0.3),
                              (-1.0, -0.5, 0.6), (0.5, -0.5, 0.6),
                              (-0.5, 0.5, 0.9), (1.0, 0.5, 0.9),
                              (0.0000001, 0.0000001, 0.0)])
        self.angle = 0
        self.mouse = (0, 0)
        self.initUI()

    def initUI(self):
        self.setGeometry(1600, 800, 800, 800)
        self.setWindowTitle("3D")
        self.show()

    def paintEvent(self, e):
        qp = QPainter()
        qp.begin(self)
        self.render(qp)
        qp.end()

    def mousePressEvent(self, event):
        self.mouse = (event.pos().x(), event.pos().y())
        self.init_angle = self.angle

    def mouseMoveEvent(self, event):
        if event.buttons() & QtCore.Qt.LeftButton:
            sx, sy = self.mouse
            self.angle = self.init_angle + (event.pos().x() - sx)
            self.update()

    def render(self, qp):
        qp.setPen(QPen(Qt.red, 4))
        points = self.threed.rotation(self.angle)
        for x, y in self.threed.projection(points):
            qp.drawPoint(int(400 + (x * 100)), int(400 + (y * 100)))

        qp.setPen(QPen(Qt.black, 1))
        p = self.threed.projection(points)
        lines = [(0, 1), (0, 2), (1, 3), (1, 5), (0, 4), (2, 3), (4, 5), (4, 6), (2, 6), (3, 7), (5, 7), (6, 7)]
        for a, b in lines:
            x0, y0 = p[a]
            x1, y1 = p[b]
            qp.drawLine(int(400 + (x0 * 100)), int(400 + (y0 * 100)), int(400 + (x1 * 100)), int(400 + (y1 * 100)))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    ex = MyApp()
    sys.exit(app.exec_())
```

적당히 직육면체 비슷하게 점을 찍고 중심점도 하나 찍은 다음, 명확하게 보이기 위해 선분도 그려주었다. 결과는 아래와 같다.

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/3.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

상당히 그럴듯하게 출력된다. 사실 별 기대하지 않았는데 생각한대로 바로 잘 되서 의외였다.

이제 그 다음으로 당연히 좌우 회전 뿐 아니라 다른 회전까지 확장해보기로 했다. 그런데 잘 생각해보면 다른 회전이라고 해봐야 축만 다를 뿐 결국 위에 했던 과정이 똑같을거라는 걸 쉽게 생각할 수 있다.

그래서 상하 회전을 생각해보면, 우선 x좌표는 아무리 회전하든 그대로일거라고 생각할 수 있고 yz 좌표값만 변할 것이다. 그리고 이 두 회전을 연속으로 시행하면 최종적인 좌표를 얻을 수 있을 거라고 생각했다. 그래서 이를 바탕으로 아까 코드를 복붙해서 뒤에 붙여넣고 축만 수정해보았다.

```python
import sys
import math
from PyQt5.QtWidgets import QWidget, QApplication
from PyQt5.QtGui import QPainter, QPen
from PyQt5.QtCore import Qt
from PyQt5 import QtCore

class ThreeD:
    def __init__(self, points):
        self.points = points

    def rotation(self, angle, angle2):
        points_rot = []
        for i, (x, y, z) in enumerate(self.points):
            length = math.sqrt(pow(x, 2) + pow(y, 2))
            xa = math.acos(x / length)
            if y < 0: xa = -xa
            new_angle = xa + (angle * math.pi / 180)
            x = math.cos(new_angle) * length
            y = math.sin(new_angle) * length

            length = math.sqrt(pow(y, 2) + pow(z, 2))
            if length == 0.0: length = 0.00000000001
            ya = math.acos(y / length)
            if z < 0: ya = -ya
            new_angle2 = ya + (angle2 * math.pi / 180)
            y = math.cos(new_angle2) * length
            z = math.sin(new_angle2) * length
            points_rot.append( (x, y, z) )
        return points_rot

    def projection(self, points):
        points_2d = []
        for x, y, z in points:
            points_2d.append( (x, z) )
        return points_2d

class MyApp(QWidget):

    def __init__(self):
        super().__init__()
        self.threed = ThreeD([(-1.0, -1.0, 1.0), (1.0, -1.0, 1.0),
                              (-1.0, 1.0, 1.0), (1.0, 1.0, 1.0),
                              (-1.0, -1.0, -1.0), (1.0, -1.0, -1.0),
                              (-1.0, 1.0, -1.0), (1.0, 1.0, -1.0),
                              (0.0000001, 0.0000001, 0.0)])
        self.angle = 0
        self.angle2 = 0
        self.mouse = (0, 0)
        self.initUI()

    def initUI(self):
        self.setGeometry(1600, 800, 800, 800)
        self.setWindowTitle("3D")
        self.show()

    def paintEvent(self, e):
        qp = QPainter()
        qp.begin(self)
        self.render(qp)
        qp.end()

    def mousePressEvent(self, event):
        self.mouse = (event.pos().x(), event.pos().y())
        self.init_angle = self.angle
        self.init_angle2 = self.angle2

    def mouseMoveEvent(self, event):
        if event.buttons() & QtCore.Qt.LeftButton:
            sx, sy = self.mouse
            self.angle = self.init_angle + (event.pos().x() - sx)
            self.angle2 = self.init_angle2 + (event.pos().y() - sy)
            self.update()

    def render(self, qp):
        qp.setPen(QPen(Qt.red, 4))
        points = self.threed.rotation(self.angle, self.angle2)
        for x, y in self.threed.projection(points):
            qp.drawPoint(int(400 + (x * 100)), int(400 + (y * 100)))

        qp.setPen(QPen(Qt.black, 1))
        p = self.threed.projection(points)
        lines = [(0, 1), (0, 2), (1, 3), (1, 5), (0, 4), (2, 3), (4, 5), (4, 6), (2, 6), (3, 7), (5, 7), (6, 7)]
        for a, b in lines:
            x0, y0 = p[a]
            x1, y1 = p[b]
            qp.drawLine(int(400 + (x0 * 100)), int(400 + (y0 * 100)), int(400 + (x1 * 100)), int(400 + (y1 * 100)))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    ex = MyApp()
    sys.exit(app.exec_())
```

이제는 상하좌우 회전이 되므로 완전한 정육면체를 출력하도록 해봤다.

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/4.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

아주 괜찮은 결과물이 되었다. 처음에 이리저리 돌리다보니 0 으로 나누는 에러가 발생했는데, 다시 확인해봤더니 연산의 특성상, 만약 좌표가 (0, 0) 이 되어 크기가 0 이 되면 결과적으로 0 으로 나누게 되기 때문에, 어떻게 처리할까 하다가 그냥 귀찮아서 만약 크기가 0 이 되면 0 에 적당히 가까운 값(0.00000000001)으로 바꾸도록 처리했다.

이 시점에서 깨달은 것은, 지금까지 두 축의 회전을 구현했는데 나머지 한 축으로도 회전을 할 수 있다는 것인데 그렇게 3개 축 회전은 마우스로 2차원 상에서 조정하기 좀 애매하고 귀찮아지니 그냥 안 하기로 했다.

<br>

## Obj

이제 그럴듯하게 회전이 완성되었으니, 정육면체 같은 게 아니라 실제 복잡한 3D 모델링을 출력해보기로 했다. 3D 모델 관련 파일 포맷들을 몇 개 살펴보았는데, 일단 무료 3D 툴인 [블렌더](https://www.blender.org/)를 설치하고 실행해서, 익스포트 가능한 포맷들을 보니 아래와 같았다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/13/2.jpg" data-lity>
  <img src="/assets/img/posts/13/2.jpg" style="width:500px" />
</a>
</div>

이 중에서 구글 검색하면서 하나하나 살펴보니, [Wavefront obj](https://en.wikipedia.org/wiki/Wavefront_.obj_file) 포맷이 가장 심플한 것 같아서 이걸로 해보기로 했다.

파싱은 굉장히 간단해서 별로 할 것도 없다. 그래서 대충 블렌더에서 아무 오브젝트나 몇 개 만들어서 테스트해보았다.

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/5.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

<br>

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/6.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

아주 잘 출력된다. 여기에 추가로 실제 실용적인 모델로 테스트를 해보기 위해, 예전에 험블 번들에서 사둔 것들 중에서 적당한 걸 골라보다가 언리얼 밀리터리 에셋이 있어서 여기에 포함된 에셋 중 백팩 모델이 있어서 이를 obj 로 익스포트해서 바로 출력해봤다.

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/7.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

이 파일은 확인해보니 정점 좌표가 -1.0 ~ 1.0 범위가 아니어서 더 큰 값들이 있었는데, 문제가 생기지 않을까 했지만 그냥 적당히 잘 출력되는 것 같다.

위에서 보다시피 처음에는 주어진 f 정보가 삼각형(정점 3개)이든 다각형(정점 4개)이든 그냥 모든 정점 인덱스끼리 다 조합해서 선분을 그렸었는데, 그냥 적혀있는 순서대로 연결해서 선분 4개만 그리면 다각형일 때 중간의 대각선이 그려지지 않도록 되어있는 것 같아서, 그렇게 바꾸었다. 그리고 마우스 휠로 확대 축소도 대충 구현했다.

```python
import sys
import math
from itertools import combinations
from PyQt5.QtWidgets import QWidget, QApplication
from PyQt5.QtGui import QPainter, QPen, QBrush, QPolygon, QColor
from PyQt5.QtCore import Qt, QPoint
from PyQt5 import QtCore

class Obj:
    def __init__(self, filename):
        self.vertex = []
        self.line = []
        self.triangle = []
        self.polygon = []
        self.parse(open(filename, "r").read())

    def parse(self, data):
        for line in data.split("\n"):
            if line[:2] == "v ":
                self.vertex.append( tuple(map(lambda x: float(x), line[2:].split(" "))) )
            elif line[:2] == "f ":
                v = list(map(lambda x: int(x.split("/")[0])-1, line[2:].split(" ")))
                if len(v) == 3: self.triangle.append(v)
                elif len(v) == 4: self.polygon.append(v)

                for i in range(len(v)):
                    a = v[i]
                    b = v[(i+1) % len(v)]
                    self.line.append( (a, b) if a < b else (b, a) )
        self.line = list(set(self.line))

class ThreeD:
    def __init__(self):
        obj = Obj("model.obj")
        self.vertex = obj.vertex
        self.line = obj.line
        self.triangle = obj.triangle
        self.polygon = obj.polygon

    def rotation(self, angle, angle2):
        vertex_rot = []
        for x, y, z in self.vertex:
            length = math.sqrt(pow(x, 2) + pow(y, 2))
            if length == 0.0: length = 0.00000000001
            xa = math.acos(x / length)
            if y < 0: xa = -xa
            new_angle = xa + (angle * math.pi / 180)
            x = math.cos(new_angle) * length
            y = math.sin(new_angle) * length

            length = math.sqrt(pow(y, 2) + pow(z, 2))
            if length == 0.0: length = 0.00000000001
            ya = math.acos(y / length)
            if z < 0: ya = -ya
            new_angle2 = ya + (angle2 * math.pi / 180)
            y = math.cos(new_angle2) * length
            z = math.sin(new_angle2) * length

            vertex_rot.append( (x, y, z) )
        return vertex_rot

    def projection(self, vertex):
        vertex_2d = []
        for x, y, z in vertex:
            vertex_2d.append( (x, z) )
        return vertex_2d

class MyApp(QWidget):
    def __init__(self):
        super().__init__()
        self.threed = ThreeD()
        self.angle = 0
        self.angle2 = 0
        self.size = 100
        self.mouse = (0, 0)
        self.initUI()

    def initUI(self):
        self.setGeometry(1600, 800, 800, 800)
        self.setWindowTitle("3D")
        self.show()

    def paintEvent(self, e):
        qp = QPainter()
        qp.begin(self)
        self.render(qp)
        qp.end()

    def mousePressEvent(self, event):
        self.mouse = (event.pos().x(), event.pos().y())
        self.init_angle = self.angle
        self.init_angle2 = self.angle2

    def mouseMoveEvent(self, event):
        if event.buttons() & QtCore.Qt.LeftButton:
            sx, sy = self.mouse
            self.angle = self.init_angle + (event.pos().x() - sx)
            self.angle2 = self.init_angle2 + (event.pos().y() - sy)
            self.update()

    def wheelEvent(self, event):
        delta = 1 if event.angleDelta().y() > 0 else -1
        self.size += delta * 10
        self.update()

    def render(self, qp):
        size = self.size
        qp.setPen(QPen(Qt.red, 4))
        vertex = self.threed.rotation(self.angle, self.angle2)
        for x, y in self.threed.projection(vertex):
            qp.drawPoint(int(400 + (x * size)), int(400 + (y * size)))

        p = self.threed.projection(vertex)
        qp.setPen(QPen(Qt.black, 1))
        for a, b in self.threed.line:
            x0, y0, x1, y1 = p[a] + p[b]
            qp.drawLine(int(400 + (x0 * size)), int(400 + (y0 * size)), int(400 + (x1 * size)), int(400 + (y1 * size)))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    ex = MyApp()
    sys.exit(app.exec_())
```

<br>

## Miscellaneous

일단은 여기까지 하고 나중에 또 시간 날 떄 텍스쳐 매핑이나 조명 등 여러가지를 한 번 구현해보기로 했다. 그 전에 마지막으로 가볍게 단순히 색상을 채워넣기만 해보기로 했다. PyQt 의 drawConvexPolygon 을 써서 그냥 랜덤한 색으로 채워넣는 것만 해봤더니 아래와 같았다.

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/8.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

뭔가 좀 이상하게 출력되는데, 색상을 채워넣는 순서가 고정이다보니 앞 쪽에 있는 사각형을 뒤 쪽에 있는 사각형보다 먼저 그리게 되면 나중에 뒤 쪽 사각형이 채워질 때 덮어씌워지기 때문인 것 같다.

그리는 순서를 어떻게 해야할까 생각해봤는데, y좌표가 깊이를 나타내므로 처음에는 각 다각형 정점들 중 가장 큰 y좌표 값을 기준으로 정렬해보거나, y좌표 값의 합으로 정렬해보거나 이런 저런 방법을 해봤는데 y좌표의 합으로 정렬하는 방식은 정육면체나 구 같은 단순한 모델에서는 문제가 없어보였지만 복잡한 모델에서는 이리저리 돌리다보면 아래처럼 그리는 순서가 부분적으로 꼬이는 것을 볼 수 있었다. 

<div markdown=1 class="sx-center">
<video height="400" autoplay muted loop>
<source src="/assets/video/posts/13/9.mp4" type="video/mp4">
Your browser does not support video.
</video>
</div>

어차피 다음에 텍스쳐 매핑을 구현하려면 각 다각형을 래스터화하고 픽셀당 그리기를 해야하는데, 그 떄는 각 픽셀당 깊이 값으로 체크를 해서 그릴지 안 그릴지를 선택할 수 있어서 해결할 수 있을 문제같으므로 지금은 이 정도로 하고 보류하기로 했다.

여기까지의 최종적인 코드는 아래와 같다.

```python
import sys
import math
import random
from itertools import combinations
from PyQt5.QtWidgets import QWidget, QApplication
from PyQt5.QtGui import QKeyEvent, QPainter, QPen, QBrush, QPolygon, QColor
from PyQt5.QtCore import Qt, QPoint
from PyQt5 import QtCore

class Obj:
    def __init__(self, filename):
        self.vertex = []
        self.line = []
        self.triangle = []
        self.polygon = []
        self.parse(open(filename, "r").read())

    def parse(self, data):
        for line in data.split("\n"):
            if line[:2] == "v ":
                self.vertex.append( tuple(map(lambda x: float(x), line[2:].split(" "))) )
            elif line[:2] == "f ":
                v = list(map(lambda x: int(x.split("/")[0])-1, line[2:].split(" ")))
                if len(v) == 3: self.triangle.append(v)
                elif len(v) == 4: self.polygon.append(v)

                for i in range(len(v)):
                    a = v[i]
                    b = v[(i+1) % len(v)]
                    self.line.append( (a, b) if a < b else (b, a) )
        self.line = list(set(self.line))

class ThreeD:
    def __init__(self):
        obj = Obj("model.obj")
        self.vertex = obj.vertex
        self.line = obj.line
        self.triangle = obj.triangle
        self.polygon = obj.polygon
        self.colors = []
        for _ in range(len(self.triangle+self.polygon)):
            r = int(random.random() * 1000) % 256
            g = int(random.random() * 1000) % 256
            b = int(random.random() * 1000) % 256
            self.colors.append( QColor(r, g, b) )

    def rotation(self, angle, angle2):
        vertex_rot = []
        for x, y, z in self.vertex:
            length = math.sqrt(pow(x, 2) + pow(y, 2))
            if length == 0.0: length = 0.00000000001
            xa = math.acos(x / length)
            if y < 0: xa = -xa
            new_angle = xa + (angle * math.pi / 180)
            x = math.cos(new_angle) * length
            y = math.sin(new_angle) * length

            length = math.sqrt(pow(y, 2) + pow(z, 2))
            if length == 0.0: length = 0.00000000001
            ya = math.acos(y / length)
            if z < 0: ya = -ya
            new_angle2 = ya + (angle2 * math.pi / 180)
            y = math.cos(new_angle2) * length
            z = math.sin(new_angle2) * length

            vertex_rot.append( (x, y, z) )
        return vertex_rot

    def projection(self, vertex):
        vertex_2d = []
        for x, y, z in vertex:
            vertex_2d.append( (x, z) )
        return vertex_2d

class MyApp(QWidget):
    def __init__(self):
        super().__init__()
        self.threed = ThreeD()
        self.angle = 0
        self.angle2 = 0
        self.size = 100
        self.mouse = (0, 0)
        self.flag = 0
        self.initUI()

    def initUI(self):
        self.setGeometry(1600, 800, 800, 800)
        self.setWindowTitle("3D")
        self.show()

    def paintEvent(self, e):
        qp = QPainter()
        qp.begin(self)
        self.render(qp)
        qp.end()

    def mousePressEvent(self, event):
        self.mouse = (event.pos().x(), event.pos().y())
        self.init_angle = self.angle
        self.init_angle2 = self.angle2

    def mouseMoveEvent(self, event):
        if event.buttons() & QtCore.Qt.LeftButton:
            sx, sy = self.mouse
            self.angle = self.init_angle + (event.pos().x() - sx)
            self.angle2 = self.init_angle2 + (event.pos().y() - sy)
            self.update()

    def wheelEvent(self, event):
        delta = 1 if event.angleDelta().y() > 0 else -1
        self.size += delta * 10
        self.update()

    def keyPressEvent(self, a0):
        self.flag = self.flag ^ 1
        self.update()
        return super().keyPressEvent(a0)

    def render(self, qp):
        size = self.size
        qp.setPen(QPen(Qt.red, 4))
        vertex = self.threed.rotation(self.angle, self.angle2)
        for x, y in self.threed.projection(vertex):
            qp.drawPoint(int(400 + (x * size)), int(400 + (y * size)))

        all_poly = [ (i, o) if len(o) == 4 else (i, tuple([*o, o[2]])) for i, o in enumerate(self.threed.triangle+self.threed.polygon) ]
        all_poly = sorted(all_poly, key=lambda x: sum([vertex[i][1] for i in x[1]]))
        if self.flag == 1:
            all_poly = all_poly[-40:]

        p = self.threed.projection(vertex)
        qp.setPen(QPen(Qt.black, 1))
        for a, b in self.threed.line:
            x0, y0, x1, y1 = p[a] + p[b]
            qp.drawLine(int(400 + (x0 * size)), int(400 + (y0 * size)), int(400 + (x1 * size)), int(400 + (y1 * size)))

        for i, (a, b, c, d) in all_poly:
            qp.setBrush(QBrush(self.threed.colors[i]))
            x0, y0, x1, y1, x2, y2, x3, y3 = tuple(map(lambda x: int(400 + (x * size)), p[a] + p[b] + p[c] + p[d]))
            qp.drawConvexPolygon(QPolygon( [QPoint(x0, y0), QPoint(x1, y1), QPoint(x2, y2), QPoint(x3, y3)] ))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    ex = MyApp()
    sys.exit(app.exec_())
```

<br>
