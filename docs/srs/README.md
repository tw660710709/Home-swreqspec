# docs/srs

วาง SRS ฉบับเต็ม (PDF หรือ Markdown) และ diagram ทุกภาพของทีมไว้ที่นี่
AI จะเปิดอ่านเมื่อ spec.md ไม่ชัด แต่ spec.md ยังเป็นความจริงหนึ่งเดียวเสมอ

# Software Requirements Specification (SRS)
## ระบบ ระบบหาหอพัก

## Journey Map
![Journey Map](images/Journey-Map.png)
**ผู้รับผิดชอบ**<br>
660710709 ธนกฤต เวทยนุกูล รับผิดชอบ Phase และ Action<br>
660710741 ศิริวุฒิ ชัยเกียรติธรรม รับผิดชอบ Emotion<br>
670710713 ชนัสถ์นันท์ วะรีวะราช รับผิดชอบ Backstage และ Problem<br>
670710322 ธันยธรณ์ บุญมาก รับผิดชอบ Touch Point<br>
670710746 ณัฎฐพล ดาเจริญ   รับผิดชอบ Data<br>
670710729 พิทักษ์พล ชยานนท์นุรักษ์ รับผิดชอบ Duration และ Opportunity<br>

## Stakeholder
![Stakeholder](images/Stakeholder.png)
**ผู้รับผิดชอบ**<br>
660710709 ธนกฤต เวทยนุกูล<br>
660710741 ศิริวุฒิ ชัยเกียรติธรรม<br>

## Onion Diagram
![Onion Diagram](images/Onion-Diagram.png)
**ผู้รับผิดชอบ**<br>
670710729 พิทักษ์พล ชยานนท์นุรักษ์<br>
670710746 ณัฎฐพล ดาเจริญ<br>

## Requirement
![Requirement](images/Requirement.png)
**ผู้รับผิดชอบ**<br>
670710713 ชนัสถ์นันท์ วะรีวะราช<br>

## Requirements Prioritization
![Requirements Prioritization](images/Requirements-Prioritization.png)
**ผู้รับผิดชอบ**<br>
660710709 ธนกฤต เวทยนุกูล รับผิดชอบ UC-01<br>
670710713 ชนัสถ์นันท์ วะรีวะราช รับผิดชอบ UC-03<br>

## system context
<img width="695" height="645" alt="image" src="https://github.com/user-attachments/assets/192212b6-9d79-4f4d-91b6-a79dc69bbd50" /><br>
**ผู้รับผิดชอบ**<br>
670710746 ณัฎฐพล ดาเจริญ<br>

## architecture overview
<img width="1702" height="744" alt="image" src="https://github.com/user-attachments/assets/570568a3-8d8a-4353-b397-c93da26c3cd7" /><br>
**ผู้รับผิดชอบ**<br>
670710729 พิทักษ์พล ชยานนท์นุรักษ์<br>


## use case diagram

## use case specification

<details>
<summary>UC-01 | ค้นหาและดูข้อมูลหอพัก</summary>

![UC-01](images/usecases/UC-01-search.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-02 | สมัครสมาชิก</summary>

![UC-02](images/usecases/UC-02-register.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-03 | จัดการข้อมูลหอพัก</summary>

![UC-03](images/usecases/UC-03-manage-dormitory-data.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-04 | อัพเดทสถานะห้องว่าง</summary>

![UC-04](images/usecases/UC-04-update-room-data.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-05 | ดูสถิติหอพัก</summary>

![UC-05](images/usecases/UC-05-view-dormitory-statistics.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-06 | นัดหมายดูห้องพัก</summary>

![UC-06](images/usecases/UC-06-schedule-a-room-viewing.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-07 | เข้าสู่ระบบ</summary>

![UC-07](images/usecases/UC-07-login.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-08 | จัดการบัญชีผู้ใช้</summary>

![UC-08](images/usecases/UC-08-manage-account.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-09 | เขียนและแก้ไขรีวิวหอพัก</summary>

![UC-09](images/usecases/UC-09-review-data.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>

## Requirement Smells

<details>
<summary>UC-01 | ค้นหาและดูข้อมูลหอพัก</summary>

![UC-01](images/smells/UC-01-search.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>
<details>
<summary>UC-02 | สมัครสมาชิก</summary>

![UC-02](images/smells/UC-02-register.png)

**ผู้รับผิดชอบ:** 660710709 ธนกฤต เวทยนุกูล
</details>

<details>
<summary>UC-03 | จัดการข้อมูลหอพัก</summary>

![UC-01](images/smells/Smell03.png)

**ผู้รับผิดชอบ:** 670710713 ชนัสถ์นันท์ วะรีวะราช
</details>

<details>
<summary>UC-04 | อัพเดทสถานะห้องว่าง</summary>

![UC-01](images/smells/Smell04.png)

**ผู้รับผิดชอบ:** 670710713 ชนัสถ์นันท์ วะรีวะราช
</details>

<details>
<summary>UC-05 | ดูสถิติหอพัก</summary>
  
<img width="795" height="563" alt="image" src="https://github.com/user-attachments/assets/885959b2-8436-4c07-a80c-638969e97763" />

**ผู้รับผิดชอบ:** 670710729 พิทักษ์พล ชยานนท์นุรักษ์<br>
</details>

<details>
<summary>UC-06 | นัดหมายดูห้องพัก</summary>

<img width="809" height="608" alt="image" src="https://github.com/user-attachments/assets/216373ac-cb51-4135-99c5-ec5d6f89eba8" />

**ผู้รับผิดชอบ:** 670710729 พิทักษ์พล ชยานนท์นุรักษ์<br>
</details>

<details>
<summary>UC-07 | เข้าสู่ระบบ</summary>

<img width="946" height="794" alt="image" src="https://github.com/user-attachments/assets/4b28d2be-2962-4d97-abb8-20d3259cbc4e" />

**ผู้รับผิดชอบ:** 670710746 ณัฎฐพล ดาเจริญ
</details>

<details>
<summary>UC-08 | จัดการบัญชีผู้ใช้</summary>

<img width="959" height="782" alt="image" src="https://github.com/user-attachments/assets/b9f9557a-f6ad-44c9-bc59-a9a6259c5ebe" />

**ผู้รับผิดชอบ:** 670710746 ณัฎฐพล ดาเจริญ
</details>

<details>
<summary>UC-09 | เขียนเเละเเก้ไขรีวิวหอพัก</summary>

![UC-09](images/smells/Smell09.png)

**ผู้รับผิดชอบ:** 670710713 ชนัสถ์นันท์ วะรีวะราช
</details>

