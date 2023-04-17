<style lang="scss">
.bg-chat {
  background: linear-gradient(135deg, #93c7f5 0%, #c6a8f7 50%, #ffd9ce 100%);
}
.chat-wrap {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}
.chat-input {
  border: none;
  outline: none;
  background: #f7f9fb;
  padding: 9px 10px;
  // font-size: 16px;
  word-break: break-all;
}
.chat-btn {
  border: none;
  outline: none;
  padding: 10px 15px;
  border-radius: 3px;
  background: #775da6;
  color: #fff;
  cursor: pointer;
  &:hover {
    background: #7e6ba8;
  }
}
</style>

<template>
  <div>
    <div class="h-flex vh100 bg-chat">
      <div class="bg-white">
        <div class="chat-wrap pt-3 pb-3 pos-r">
          <div class="al-c">
            <img :src="logo" width="40" class="mr-3 bdrs-100" />
            <div>
              <h2 class="fz-16">{{ info.title || "ChatGPT Demo" }}</h2>
              <p class="gray fz-13">
                {{ info.desc || "Based on OpenAI API (gpt-3.5-turbo)." }}
              </p>
            </div>
            <div class="ml-auto">
              <img
                src="img/key.svg"
                width="22"
                class="d-b hover-1"
                @click="showSetting = true"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 ov-a" ref="chatList" @scroll="onScroll">
        <div class="chat-wrap">
          <chat-list
            :list="comboList"
            :logo="logo"
            :avatar="info.avatarUser || 'img/avatar.jpg'"
          ></chat-list>
        </div>
      </div>
      <div class="">
        <div class="chat-wrap pos-r" style="padding-top: 0">
          <div
            class="pos-a right-0 mr-3 pa-3 hover-1"
            style="top: -56px"
            v-if="!isBtm"
            @click="smoothToBtm"
          >
            <img src="img/to-btm.svg" width="30" />
          </div>
          <div class="d-flex al-c bg-white pa-2 bdrs-5">
            <input
              class="flex-1 chat-input fz-16"
              type="text"
              placeholder="Enter something..."
              v-model="inputMsg"
              @keyup.enter="onSend"
            />
            <button class="chat-btn ml-3" @click="onSend">Send</button>
            <div class="pa-2 ml-1 hover-1" @click="onClear">
              <img src="img/clean.svg" width="20" class="d-b" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="pos-mask trans-200"
      :class="{
        'op-0 ev-n': !showSetting,
      }"
    >
      <div class="pos-mask bg-black-3" @click="showSetting = false"></div>
      <div
        class="pos-a top-0 w100p z-100 bg-white trans-200"
        :class="{
          'up-close': !showSetting,
        }"
      >
        <div class="chat-wrap">
          <div class="fz-14 mb-2 gray">
            OpenAI apiKey (Stored in localStorage)
          </div>
          <div class="d-flex">
            <textarea
              v-model="newApiKey"
              @keyup.enter="onNewApiKey"
              type="text"
              rows="3"
              class="chat-input flex-1"
              placeholder="sk-******"
            />
            <button class="chat-btn ml-2" @click="onNewApiKey">OK</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { SSE } from "sse";
import ChatList from "./chat-list.vue";
import { throttle } from "../../utils/timer";
import Axios from "axios";

export default {
  components: {
    ChatList,
  },
  data() {
    const apiKey =
      localStorage.apiKey || process.env.VUE_APP_OPENAI_API_KEY || "";
    return {
      inputMsg: "",
      info: {},
      apiKey,
      newApiKey: apiKey,
      msgList: JSON.parse(localStorage.msgList || "[]"),
      lastMsg: "",
      streaming: false,
      isBtm: true,
      showSetting: false,
    };
  },
  computed: {
    ...mapState({
      asMobile: (s) => s.asMobile,
    }),
    logo() {
      return this.info.avatarAi || "img/logo-ai.jpg";
    },
    comboList() {
      if (this.lastMsg || this.streaming)
        return [
          ...this.msgList,
          {
            content: this.lastMsg || "...",
            role: "assistant",
          },
        ];
      return this.msgList;
    },
  },
  watch: {
    lastMsg() {
      if (this.isBtm) {
        this.$nextTick(() => {
          this.smoothToBtm(0);
        });
      }
    },
    apiKey() {
      localStorage.apiKey = this.apiKey;
    },
  },
  mounted() {
    setTimeout(() => {
      if (this.msgList.length) this.smoothToBtm(0);
    }, 200);
    this.getConfig();
  },
  methods: {
    async getConfig() {
      try {
        const { data } = await Axios.get("./config.json");
        const info = {};
        for (const key in data) {
          const arr = data[key];
          for (const row of arr) {
            info[row.key] = row.value;
          }
        }
        console.log(info);
        this.info = info;
        if (info.apiKey) {
          this.apiKey = info.apiKey;
        }
        if (info.title) {
          document.title = info.title;
        }
      } catch (error) {
        console.log(error);
      }
    },
    onNewApiKey() {
      if (!/^sk-\w{48}$/.test(this.newApiKey)) {
        window.alert("malformed api key");
        return;
      }
      this.apiKey = this.newApiKey;
      this.showSetting = false;
    },
    onScroll(e) {
      this.isBtm =
        e.target.scrollTop >=
        e.target.scrollHeight - e.target.offsetHeight - 40;
    },
    smoothToBtm(delay = 300, behavior = "smooth") {
      const el = this.$refs.chatList;
      if (!delay) {
        el.scrollTo({
          top: el.scrollHeight,
        });
        return;
      }
      throttle(() => {
        console.log("to btm");
        el.scrollTo({
          top: el.scrollHeight,
          behavior,
        });
      }, delay)();
    },
    onSend() {
      if (!this.apiKey) {
        this.showSetting = true;
        return;
      }
      let msg = this.inputMsg.trim();
      if (!msg) return;
      this.isBtm = true;
      this.inputMsg = "";
      if (this.lastSource) {
        this.lastSource.close();
      }
      setTimeout(() => {
        this.pushMsg(msg);
        this.smoothToBtm(30);
        this.onPost();
      }, 10);
    },
    onPost() {
      try {
        this.streaming = true;
        const body = this.getPayload(this.apiKey, this.msgList);
        const source = new SSE(
          "https://api.openai.com/v1/chat/completions",
          body
        );
        source.addEventListener("message", (e) => {
          if (e.data != "[DONE]") {
            const json = JSON.parse(e.data);
            // console.log(json);
            const text = json.choices[0].delta?.content || "";
            this.lastMsg = this.lastMsg + text;
          } else {
            this.pushMsg(this.lastMsg, "assistant");
            this.lastMsg = "";
            this.streaming = false;
          }
        });
        source.addEventListener("error", (e) => {
          console.log(e);
          let msg = "Network Error";
          if (e.data) {
            const data = JSON.parse(e.data);
            msg = data.error.message;
          }
          this.onErr(msg);
        });
        source.addEventListener("abort", () => {
          let msg = this.lastMsg;
          if (msg) msg += "...\n\n";
          msg += "Aborted";
          this.onErr(msg);
        });
        source.stream();
        this.lastSource = source;
      } catch (error) {
        console.log(error);
        this.onErr(error.message);
      }
    },
    onErr(msg) {
      this.pushMsg(msg, "assistant");
      this.streaming = false;
      this.lastMsg = "";
      this.smoothToBtm(30);
    },
    pushMsg(content, role = "user") {
      this.msgList.push({
        content,
        role,
      });
      this.storMsgList();
    },
    getPayload(apiKey, messages = [], opt = {}) {
      return {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        method: "POST",
        payload: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages,
          temperature: 0.6,
          stream: true,
          ...opt,
        }),
      };
    },
    onClear() {
      this.streaming = false;
      this.inputMsg = "";
      this.msgList = [];
      this.storMsgList();
    },
    storMsgList() {
      localStorage.msgList = JSON.stringify(this.msgList);
    },
  },
};
</script>