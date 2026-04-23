import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MermaidError from "../../src/components/MermaidError.vue";

describe("MermaidError", () => {
  it("does not render the error banner when there is no render error", () => {
    const wrapper = mount(MermaidError, {
      props: {
        renderError: false,
        renderErrorDetails: "Parser error",
      },
    });

    expect(wrapper.find(".diagram-error").exists()).toBe(false);
  });

  it("toggles error details when the details button is clicked", async () => {
    const wrapper = mount(MermaidError, {
      props: {
        renderError: true,
        renderErrorDetails: "Parser error",
      },
    });

    expect(wrapper.text()).toContain("Failed to render diagram");
    expect(wrapper.find(".error-details").exists()).toBe(false);

    await wrapper.get(".error-toggle-button").trigger("click");

    expect(wrapper.find(".error-details").text()).toContain("Parser error");
    expect(wrapper.get(".error-toggle-button").text()).toBe("Hide Details");

    await wrapper.get(".error-toggle-button").trigger("click");

    expect(wrapper.find(".error-details").exists()).toBe(false);
    expect(wrapper.get(".error-toggle-button").text()).toBe("Show Details");
  });
});
