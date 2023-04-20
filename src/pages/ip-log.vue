<template>
  <div class="pa-4 lh-2">
    <p>本机IP: {{ info.ip || "获取中..." }}</p>
    <template v-if="info.ip">
      <p>
        状态：<span :class="info.isOk ? 'suc-1' : 'red-1'">{{
          info.isOk ? "可用" : "不可用"
        }}</span>
      </p>
      <p class="mt-5" v-if="info.isOk">
        <button @click="getInfo(true)">
          {{ loading ? "禁用中..." : "禁用" }}
        </button>
      </p>
    </template>
  </div>
</template>

<script>
import Axios from "axios";

export default {
  data() {
    return {
      info: {
        ip: "",
        isOk: true,
      },
      loading: false,
    };
  },
  mounted() {
    this.tag = this.$route.query.tag || 1;
    this.getInfo();
  },
  methods: {
    async getInfo(stop) {
      try {
        this.loading = true;
        const body = {
          tag: this.tag,
        };
        if (stop) {
          body.status = 1;
        }
        const { data } = await Axios.post(
          "https://www.tablofun.com/api-v3/mp/memo/check-ip",
          body
        );
        this.info = data;
        if (stop) location.reload();
      } catch (error) {
        console.log(error);
      }
      this.loading = false;
    },
  },
};
</script>