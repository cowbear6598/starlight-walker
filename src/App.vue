<script setup lang="ts">
import GalleryFrame from '@/components/scene/GalleryFrame.vue'
import MainScene from '@/components/scene/MainScene.vue'
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <div class="corner-cloud corner-cloud--tl">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 70 Q10 40 40 40 Q40 20 60 20 Q60 10 70 10" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M5 60 Q5 30 35 30 Q35 15 55 15" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M15 75 Q15 50 45 50 Q45 35 65 35 Q65 25 75 25" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>
    </div>
    <div class="corner-cloud corner-cloud--tr">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: scaleX(-1)">
        <path d="M10 70 Q10 40 40 40 Q40 20 60 20 Q60 10 70 10" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M5 60 Q5 30 35 30 Q35 15 55 15" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M15 75 Q15 50 45 50 Q45 35 65 35 Q65 25 75 25" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>
    </div>
    <div class="corner-cloud corner-cloud--bl">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: scaleY(-1)">
        <path d="M10 70 Q10 40 40 40 Q40 20 60 20 Q60 10 70 10" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M5 60 Q5 30 35 30 Q35 15 55 15" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M15 75 Q15 50 45 50 Q45 35 65 35 Q65 25 75 25" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>
    </div>
    <div class="corner-cloud corner-cloud--br">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: scale(-1, -1)">
        <path d="M10 70 Q10 40 40 40 Q40 20 60 20 Q60 10 70 10" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M5 60 Q5 30 35 30 Q35 15 55 15" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M15 75 Q15 50 45 50 Q45 35 65 35 Q65 25 75 25" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>
    </div>

    <!-- 左側牆面 origami-1 ~ origami-9 -->
    <div class="origami origami-1">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="8,24 20,18 32,24 20,28" fill="#d45b56" stroke="#a83a35" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="8,24 4,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="32,24 36,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <line x1="8" y1="24" x2="3" y2="30" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="32" y1="24" x2="37" y2="18" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="origami origami-2">
      <svg width="35" height="35" viewBox="0 0 40 40" fill="none">
        <polygon points="20,3 24,15 37,15 27,22 30,35 20,27 10,35 13,22 3,15 16,15" fill="#5aad6a" stroke="#3d8a4d" stroke-width="1.2" stroke-linejoin="miter"/>
      </svg>
    </div>

    <div class="origami origami-3">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="3,20 37,10 27,20" fill="#8b6fad" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="3,20 37,30 27,20" fill="#a088c4" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter"/>
        <line x1="3" y1="20" x2="27" y2="20" stroke="#6a5090" stroke-width="0.8"/>
      </svg>
    </div>

    <div class="origami origami-4">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,10 34,22 20,36 6,22" fill="#d4884a" stroke="#ad6530" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="6,22 4,6 17,15" fill="#e8a870" stroke="#ad6530" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="34,22 36,6 23,15" fill="#e8a870" stroke="#ad6530" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="15,21 17,19 19,21 17,23" fill="#ad6530"/>
        <polygon points="21,21 23,19 25,21 23,23" fill="#ad6530"/>
        <polygon points="19,27 21,27 20,29" fill="#ad6530"/>
      </svg>
    </div>

    <div class="origami origami-5">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,20 14,10 20,2 26,10" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 28,12 36,14 30,22" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 30,28 28,36 22,28" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 18,30 10,36 12,26" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 10,24 4,14 14,12" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <circle cx="20" cy="20" r="3" fill="#7c5aa0"/>
      </svg>
    </div>

    <div class="origami origami-6">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,6 34,26 6,26" fill="#5b8ec4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="5,28 35,28 31,36 9,36" fill="#7aaad4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter"/>
        <line x1="20" y1="6" x2="20" y2="26" stroke="#3d6ea0" stroke-width="0.8" opacity="0.5"/>
      </svg>
    </div>

    <div class="origami origami-7">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="20,12 6,4 4,16 17,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,24 6,34 4,22 17,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,12 34,4 36,16 23,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,24 34,34 36,22 23,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,8 21,20 20,32 19,20" fill="#3a8f9e"/>
      </svg>
    </div>

    <div class="origami origami-8">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,20 34,6 34,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 34,34 20,34" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 6,34 6,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 6,6 20,6" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <circle cx="20" cy="20" r="2" fill="#a8920f"/>
      </svg>
    </div>

    <div class="origami origami-9">
      <svg width="35" height="42" viewBox="0 0 35 42" fill="none">
        <polygon points="13,16 10,2 17,14" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="22,14 25,2 18,16" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="10,16 8,22 10,30 17.5,33 25,30 27,22 25,16 17.5,14" fill="#e8a8b5" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="13,32 22,32 25,39 10,39" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
      </svg>
    </div>

    <!-- 右側牆面 origami-10 ~ origami-18 -->
    <div class="origami origami-10">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="20,12 6,4 4,16 17,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,24 6,34 4,22 17,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,12 34,4 36,16 23,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,24 34,34 36,22 23,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,8 21,20 20,32 19,20" fill="#3a8f9e"/>
      </svg>
    </div>

    <div class="origami origami-11">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="8,24 20,18 32,24 20,28" fill="#d45b56" stroke="#a83a35" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="8,24 4,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="32,24 36,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <line x1="8" y1="24" x2="3" y2="30" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="32" y1="24" x2="37" y2="18" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="origami origami-12">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="20,35 5,15 8,10 13,7 18,5 20,4 22,5 27,7 32,10 35,15" fill="#c46b7c" stroke="#9e4a5c" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="18" y="35" width="4" height="4" rx="0.5" fill="#9e4a5c"/>
        <line x1="20" y1="35" x2="5" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="13" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="20" y2="4" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="27" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="35" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
      </svg>
    </div>

    <div class="origami origami-13">
      <svg width="35" height="35" viewBox="0 0 40 40" fill="none">
        <polygon points="20,3 24,15 37,15 27,22 30,35 20,27 10,35 13,22 3,15 16,15" fill="#5aad6a" stroke="#3d8a4d" stroke-width="1.2" stroke-linejoin="miter"/>
      </svg>
    </div>

    <div class="origami origami-14">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,20 14,10 20,2 26,10" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 28,12 36,14 30,22" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 30,28 28,36 22,28" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 18,30 10,36 12,26" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 10,24 4,14 14,12" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <circle cx="20" cy="20" r="3" fill="#7c5aa0"/>
      </svg>
    </div>

    <div class="origami origami-15">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,6 34,26 6,26" fill="#5b8ec4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="5,28 35,28 31,36 9,36" fill="#7aaad4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter"/>
        <line x1="20" y1="6" x2="20" y2="26" stroke="#3d6ea0" stroke-width="0.8" opacity="0.5"/>
      </svg>
    </div>

    <div class="origami origami-16">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,20 34,6 34,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 34,34 20,34" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 6,34 6,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 6,6 20,6" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <circle cx="20" cy="20" r="2" fill="#a8920f"/>
      </svg>
    </div>

    <div class="origami origami-17">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="3,20 37,10 27,20" fill="#8b6fad" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="3,20 37,30 27,20" fill="#a088c4" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter"/>
        <line x1="3" y1="20" x2="27" y2="20" stroke="#6a5090" stroke-width="0.8"/>
      </svg>
    </div>

    <div class="origami origami-18">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,10 34,22 20,36 6,22" fill="#d4884a" stroke="#ad6530" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="6,22 4,6 17,15" fill="#e8a870" stroke="#ad6530" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="34,22 36,6 23,15" fill="#e8a870" stroke="#ad6530" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="15,21 17,19 19,21 17,23" fill="#ad6530"/>
        <polygon points="21,21 23,19 25,21 23,23" fill="#ad6530"/>
        <polygon points="19,27 21,27 20,29" fill="#ad6530"/>
      </svg>
    </div>

    <!-- 上方牆面 origami-19 ~ origami-23 -->
    <div class="origami origami-19">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="8,24 20,18 32,24 20,28" fill="#d45b56" stroke="#a83a35" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="8,24 4,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="32,24 36,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <line x1="8" y1="24" x2="3" y2="30" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="32" y1="24" x2="37" y2="18" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="origami origami-20">
      <svg width="35" height="35" viewBox="0 0 40 40" fill="none">
        <polygon points="20,3 24,15 37,15 27,22 30,35 20,27 10,35 13,22 3,15 16,15" fill="#5aad6a" stroke="#3d8a4d" stroke-width="1.2" stroke-linejoin="miter"/>
      </svg>
    </div>

    <div class="origami origami-21">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="20,35 5,15 8,10 13,7 18,5 20,4 22,5 27,7 32,10 35,15" fill="#c46b7c" stroke="#9e4a5c" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="18" y="35" width="4" height="4" rx="0.5" fill="#9e4a5c"/>
        <line x1="20" y1="35" x2="5" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="13" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="20" y2="4" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="27" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="35" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
      </svg>
    </div>

    <div class="origami origami-22">
      <svg width="35" height="42" viewBox="0 0 35 42" fill="none">
        <polygon points="13,16 10,2 17,14" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="22,14 25,2 18,16" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="10,16 8,22 10,30 17.5,33 25,30 27,22 25,16 17.5,14" fill="#e8a8b5" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="13,32 22,32 25,39 10,39" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter"/>
      </svg>
    </div>

    <div class="origami origami-23">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="3,20 37,10 27,20" fill="#8b6fad" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="3,20 37,30 27,20" fill="#a088c4" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter"/>
        <line x1="3" y1="20" x2="27" y2="20" stroke="#6a5090" stroke-width="0.8"/>
      </svg>
    </div>

    <!-- 下方牆面 origami-24 ~ origami-28 -->
    <div class="origami origami-24">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="20,12 6,4 4,16 17,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,24 6,34 4,22 17,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,12 34,4 36,16 23,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,24 34,34 36,22 23,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,8 21,20 20,32 19,20" fill="#3a8f9e"/>
      </svg>
    </div>

    <div class="origami origami-25">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,20 14,10 20,2 26,10" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 28,12 36,14 30,22" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 30,28 28,36 22,28" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 18,30 10,36 12,26" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 10,24 4,14 14,12" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter"/>
        <circle cx="20" cy="20" r="3" fill="#7c5aa0"/>
      </svg>
    </div>

    <div class="origami origami-26">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,6 34,26 6,26" fill="#5b8ec4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="5,28 35,28 31,36 9,36" fill="#7aaad4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter"/>
        <line x1="20" y1="6" x2="20" y2="26" stroke="#3d6ea0" stroke-width="0.8" opacity="0.5"/>
      </svg>
    </div>

    <div class="origami origami-27">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <polygon points="20,20 34,6 34,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 34,34 20,34" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 6,34 6,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="20,20 6,6 20,6" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter"/>
        <circle cx="20" cy="20" r="2" fill="#a8920f"/>
      </svg>
    </div>

    <div class="origami origami-28">
      <svg width="35" height="35" viewBox="0 0 40 40" fill="none">
        <polygon points="20,3 24,15 37,15 27,22 30,35 20,27 10,35 13,22 3,15 16,15" fill="#5aad6a" stroke="#3d8a4d" stroke-width="1.2" stroke-linejoin="miter"/>
      </svg>
    </div>

    <!-- 左側正中間補位 -->
    <div class="origami origami-29">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="20,35 5,15 8,10 13,7 18,5 20,4 22,5 27,7 32,10 35,15" fill="#c46b7c" stroke="#9e4a5c" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="18" y="35" width="4" height="4" rx="0.5" fill="#9e4a5c"/>
        <line x1="20" y1="35" x2="5" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="13" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="20" y2="4" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="27" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
        <line x1="20" y1="35" x2="35" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4"/>
      </svg>
    </div>

    <!-- 右側正中間補位 -->
    <div class="origami origami-30">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <polygon points="8,24 20,18 32,24 20,28" fill="#d45b56" stroke="#a83a35" stroke-width="1.2" stroke-linejoin="miter"/>
        <polygon points="8,24 4,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <polygon points="32,24 36,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter"/>
        <line x1="8" y1="24" x2="3" y2="30" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="32" y1="24" x2="37" y2="18" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>

    <GalleryFrame>
      <MainScene />
    </GalleryFrame>
  </div>
</template>

<style scoped>
.corner-cloud {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  opacity: 0.3;
}

.corner-cloud--tl {
  top: 12px;
  left: 12px;
}

.corner-cloud--tr {
  top: 12px;
  right: 12px;
}

.corner-cloud--bl {
  bottom: 12px;
  left: 12px;
}

.corner-cloud--br {
  bottom: 12px;
  right: 12px;
}

.origami {
  position: fixed;
  pointer-events: none;
  z-index: 0;
}

/* 左側牆面 */
.origami-1 {
  top: 8%;
  left: 5%;
  opacity: 0.6;
  transform: rotate(-20deg);
}

.origami-2 {
  top: 18%;
  left: 18%;
  opacity: 0.55;
  transform: rotate(15deg);
}

.origami-3 {
  top: 30%;
  left: 8%;
  opacity: 0.6;
  transform: rotate(30deg);
}

.origami-4 {
  top: 42%;
  left: 20%;
  opacity: 0.55;
  transform: rotate(-10deg);
}

.origami-5 {
  top: 55%;
  left: 6%;
  opacity: 0.6;
  transform: rotate(25deg);
}

.origami-6 {
  top: 65%;
  left: 22%;
  opacity: 0.55;
  transform: rotate(-15deg);
}

.origami-7 {
  top: 78%;
  left: 10%;
  opacity: 0.6;
  transform: rotate(5deg);
}

.origami-8 {
  top: 88%;
  left: 20%;
  opacity: 0.5;
  transform: rotate(20deg);
}

.origami-9 {
  top: 48%;
  left: 3%;
  opacity: 0.55;
  transform: rotate(-8deg);
}

/* 右側牆面 */
.origami-10 {
  top: 10%;
  right: 12%;
  opacity: 0.6;
  transform: rotate(10deg);
}

.origami-11 {
  top: 22%;
  right: 4%;
  opacity: 0.55;
  transform: rotate(-25deg);
}

.origami-12 {
  top: 35%;
  right: 18%;
  opacity: 0.6;
  transform: rotate(8deg);
}

.origami-13 {
  top: 48%;
  right: 8%;
  opacity: 0.55;
  transform: rotate(-30deg);
}

.origami-14 {
  top: 58%;
  right: 22%;
  opacity: 0.5;
  transform: rotate(15deg);
}

.origami-15 {
  top: 70%;
  right: 5%;
  opacity: 0.6;
  transform: rotate(-12deg);
}

.origami-16 {
  top: 80%;
  right: 15%;
  opacity: 0.55;
  transform: rotate(-20deg);
}

.origami-17 {
  top: 90%;
  right: 6%;
  opacity: 0.5;
  transform: rotate(35deg);
}

.origami-18 {
  top: 42%;
  right: 3%;
  opacity: 0.55;
  transform: rotate(12deg);
}

/* 上方牆面 */
.origami-19 {
  top: 2%;
  left: 32%;
  opacity: 0.55;
  transform: rotate(10deg);
}

.origami-20 {
  top: 1%;
  left: 45%;
  opacity: 0.5;
  transform: rotate(-15deg);
}

.origami-21 {
  top: 3%;
  right: 35%;
  opacity: 0.55;
  transform: rotate(20deg);
}

.origami-22 {
  top: 1%;
  left: 55%;
  opacity: 0.5;
  transform: rotate(-5deg);
}

.origami-23 {
  top: 2%;
  right: 42%;
  opacity: 0.5;
  transform: rotate(40deg);
}

/* 下方牆面 */
.origami-24 {
  bottom: 2%;
  left: 35%;
  opacity: 0.55;
  transform: rotate(-10deg);
}

.origami-25 {
  bottom: 1%;
  left: 48%;
  opacity: 0.5;
  transform: rotate(18deg);
}

.origami-26 {
  bottom: 3%;
  right: 38%;
  opacity: 0.55;
  transform: rotate(-8deg);
}

.origami-27 {
  bottom: 1%;
  right: 48%;
  opacity: 0.5;
  transform: rotate(25deg);
}

.origami-28 {
  bottom: 2%;
  left: 42%;
  opacity: 0.5;
  transform: rotate(10deg);
}

/* 相框緊鄰左右補位 */
.origami-29 {
  top: 50%;
  left: 30%;
  opacity: 0.6;
  transform: translateY(-50%) rotate(12deg);
}

.origami-30 {
  top: 50%;
  right: 30%;
  opacity: 0.55;
  transform: translateY(-50%) rotate(-18deg);
}

/* 手機版隱藏所有牆面裝飾 */
@media (max-width: 1024px) {
  .origami,
  .corner-cloud {
    display: none;
  }
}
</style>
