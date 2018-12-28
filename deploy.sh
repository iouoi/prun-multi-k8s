# in the custom script file, we'll:
  #1. Build our images, tag each one, push each to docker hub.
  #2. Apply all configs in the 'k8s' folder
  #3. Imperatively set latest images on each deployment

docker build -t iouoi/multi-client:latest -t iouoi/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t iouoi/multi-server:latest -t iouoi/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t iouoi/multi-worker:latest -t iouoi/multi-worker:$SHA -f ./worker/Dockerfile ./worker
docker push iouoi/multi-client:latest
docker push iouoi/multi-server:latest
docker push iouoi/multi-worker:latest

docker push iouoi/multi-client:$SHA
docker push iouoi/multi-server:$SHA
docker push iouoi/multi-worker:$SHA

kubectl apply -f k8s
kubectl set image deployments/server-deployment server=iouoi/multi-server:$SHA
# "i was already running the 'latest' version (because tagging with -t implicitly makes our image tag(name) to have ':latest' at the end), so no change is needed!"
# so we want to get some version numbers to be auto applied to our image tags
kubectl set image deployment/client-deployment client=iouoi/multi-client:$SHA
kubectl set image deployment/worker-deployment worker=iouoi/multi-worker:$SHA