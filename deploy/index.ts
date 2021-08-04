import * as k8s from "@pulumi/kubernetes";

const labels = { app: "aeons" };

const deployment = new k8s.apps.v1.Deployment("aeons", {
  spec: {
    selector: { matchLabels: labels },
    replicas: 1,
    template: {
      metadata: { labels: labels },
      spec: {
        containers: [{ name: "aeons", image: "ghcr.io/aeons/aeons.dk:latest" }],
        imagePullSecrets: [{ name: "ghcr.io" }],
      },
    },
  },
});

const service = new k8s.core.v1.Service("aeons", {
  metadata: {
    name: "aeons",
  },
  spec: {
    selector: deployment.spec.selector.matchLabels,
    ports: [{ port: 80 }],
  },
});

const ingress = new k8s.networking.v1.Ingress("aeons", {
  metadata: {
    name: "aeons",
    annotations: {
      "cert-manager.io/cluster-issuer": "letsencrypt-prod",
      "nginx.ingress.kubernetes.io/force-ssl-redirect": "true",
    },
  },
  spec: {
    rules: [
      {
        host: "aeons.dk",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: service.metadata.name,
                  port: { number: service.spec.ports[0].port },
                },
              },
            },
          ],
        },
      },
    ],
    tls: [{ hosts: ["aeons.dk"], secretName: "aeons-ingress-cert" }],
  },
});
