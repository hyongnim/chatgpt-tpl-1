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
  font-size: 16px;
}
.chat-btn {
  border: none;
  outline: none;
  padding: 10px 20px;
  background: #775da6;
  color: #fff;
  cursor: pointer;
  &:hover {
    background: #7e6ba8;
  }
}
</style>

<template>
  <div class="h-flex vh100 bg-chat">
    <div class="bg-white">
      <div class="chat-wrap pt-3 pb-3">
        <div class="al-c">
          <img src="img/logo-ai.jpg" width="40" class="mr-3 bdrs-100" />
          <div>
            <h2 class="fz-16">ChatGPT Demo</h2>
            <p class="gray fz-13">Based on OpenAI API (gpt-3.5-turbo).</p>
          </div>
        </div>
      </div>
    </div>
    <div class="flex-1 ov-a" ref="chatList" @scroll="onScroll">
      <div class="chat-wrap">
        <chat-list :list="comboList"></chat-list>
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
            class="flex-1 chat-input"
            type="text"
            placeholder="Enter something..."
            v-model="inputMsg"
            @keyup.enter="onSend"
          />
          <button class="chat-btn bdrs-3 ml-3" @click="onSend">Send</button>
          <div class="pa-2 ml-1 hover-1" @click="onClear">
            <img src="img/clean.svg" width="20" class="d-b" />
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

const apiKey = process.env.VUE_APP_OPENAI_API_KEY;

export default {
  components: {
    ChatList,
  },
  data() {
    return {
      inputMsg: "",
      msgList: JSON.parse(localStorage.msgList || "[]"),
      lastMsg: "",
      streaming: false,
      isBtm: true,
    };
  },
  computed: {
    ...mapState({
      asMobile: (s) => s.asMobile,
    }),
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
  watch: {},
  mounted() {
    setTimeout(() => {
      if (this.msgList.length) this.smoothToBtm(0);
    }, 200);
  },
  methods: {
    onScroll(e) {
      this.isBtm =
        e.target.scrollTop >= e.target.scrollHeight - e.target.offsetHeight;
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
      let msg = this.inputMsg.trim();
      if (!msg) return;
      this.isBtm = true;
      this.inputMsg = "";
      this.pushMsg(msg);
      this.smoothToBtm(30);
      this.onPost();
    },
    onPost() {
      try {
        this.streaming = true;
        const body = this.getPayload(apiKey, this.msgList);
        const source = new SSE(
          "https://api.openai.com/v1/chat/completions",
          body
        );
        source.addEventListener("message", ({ data }) => {
          if (data != "[DONE]") {
            const json = JSON.parse(data);
            // console.log(json);
            const text = json.choices[0].delta?.content || "";
            this.lastMsg = this.lastMsg + text;
            if (this.isBtm)
              this.$nextTick(() => {
                this.smoothToBtm(0);
              });
          } else {
            this.pushMsg(this.lastMsg, "assistant");
            this.lastMsg = "";
            this.streaming = false;
          }
        });
        source.stream();
      } catch (error) {
        console.log(error);
        this.streaming = false;
      }
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